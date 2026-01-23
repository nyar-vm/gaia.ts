// Minimal Windows x64 PE emitter
// Generates a PE32+ executable that calls ExitProcess(exitCode)

export interface PEEmitOptions {
  exitCode?: number;
  imageBase?: number; // default 0x140000000
}

function align(value: number, alignment: number): number {
  return Math.ceil(value / alignment) * alignment;
}

function writeUint16LE(buf: Uint8Array, offset: number, value: number) {
  buf[offset] = value & 0xff;
  buf[offset + 1] = (value >>> 8) & 0xff;
}
function writeUint32LE(buf: Uint8Array, offset: number, value: number) {
  buf[offset] = value & 0xff;
  buf[offset + 1] = (value >>> 8) & 0xff;
  buf[offset + 2] = (value >>> 16) & 0xff;
  buf[offset + 3] = (value >>> 24) & 0xff;
}
function writeUint64LE(buf: Uint8Array, offset: number, value: number) {
  const low = value >>> 0;
  const high = Math.floor(value / 0x100000000) >>> 0;
  writeUint32LE(buf, offset, low);
  writeUint32LE(buf, offset + 4, high);
}

class Section {
  name: string;
  data: Uint8Array;
  virtualSize: number;
  virtualAddress: number = 0; // RVA
  sizeOfRawData: number = 0;
  pointerToRawData: number = 0;

  constructor(name: string, data: Uint8Array, virtualSize?: number) {
    this.name = name;
    this.data = data;
    this.virtualSize = virtualSize ?? data.length;
  }
}

export function emitPE(options: PEEmitOptions = {}): Uint8Array {
  const exitCode = options.exitCode ?? 0;
  const imageBase = options.imageBase ?? 0x140000000; // PE32+
  const fileAlignment = 0x200; // 512
  const sectionAlignment = 0x1000; // 4096

  // Build .rdata with import table for kernel32!ExitProcess
  const dllName = Buffer.from("KERNEL32.dll\0", "ascii");
  const funcName = Buffer.from("ExitProcess\0", "ascii");
  const hintName = new Uint8Array(2 + funcName.length); // hint(2) + name
  hintName[0] = 0; hintName[1] = 0;
  hintName.set(funcName, 2);

  // Layout inside .rdata:
  // [Import Descriptor][null desc][INT (OriginalFirstThunk)][IAT (FirstThunk)][DLL Name][Hint/Name]
  const offDesc = 0;
  const offNullDesc = offDesc + 20; // IMAGE_IMPORT_DESCRIPTOR size (5 * uint32)
  const offINT = offNullDesc + 20; // one 8-byte pointer + terminator
  const offIAT = offINT + 16;      // one 8-byte slot + terminator
  const offName = offIAT + 16;     // dll string
  const offHintName = offName + dllName.length; // hint/name for ExitProcess
  const rdataSize = align(offHintName + hintName.length, 8);
  const rdata = new Uint8Array(rdataSize);

  // We will fill descriptor fields later when RVAs are known
  rdata.set(dllName, offName);
  rdata.set(hintName, offHintName);
  // INT: pointer to hint/name
  // IAT: two entries: first is filled by loader, second is zero terminator
  // Leave IAT zeros now; loader fills it

  const rdataSection = new Section(".rdata", rdata);

  // Build .text code: mov ecx, imm32; call [rip + rel32]; ret
  const text: number[] = [];
  // mov ecx, imm32
  text.push(0xB9);
  text.push(exitCode & 0xff, (exitCode >>> 8) & 0xff, (exitCode >>> 16) & 0xff, (exitCode >>> 24) & 0xff);
  // call qword ptr [rip+disp32] => FF 15 disp32
  text.push(0xFF, 0x15, 0x00, 0x00, 0x00, 0x00); // placeholder disp32
  // ret
  text.push(0xC3);
  const textSection = new Section(".text", new Uint8Array(text));

  // Headers sizes
  const dosStubSize = 0x80; // e_lfanew points here
  const peSigSize = 4;
  const coffHeaderSize = 20;
  const optionalHeaderSize = 0xF0; // PE32+ optional header
  const sectionHeaderSize = 40;
  const numberOfSections = 2;
  const headersSize = align(dosStubSize + peSigSize + coffHeaderSize + optionalHeaderSize + sectionHeaderSize * numberOfSections, fileAlignment);

  // Assign section RVAs and raw pointers
  let currentVA = align(headersSize, sectionAlignment);
  let currentRaw = headersSize;

  // .text
  textSection.virtualAddress = currentVA;
  textSection.sizeOfRawData = align(textSection.data.length, fileAlignment);
  textSection.pointerToRawData = currentRaw;
  currentVA = align(currentVA + align(textSection.virtualSize, sectionAlignment), sectionAlignment);
  currentRaw += textSection.sizeOfRawData;

  // .rdata
  rdataSection.virtualAddress = currentVA;
  rdataSection.sizeOfRawData = align(rdataSection.data.length, fileAlignment);
  rdataSection.pointerToRawData = currentRaw;
  currentVA = align(currentVA + align(rdataSection.virtualSize, sectionAlignment), sectionAlignment);
  currentRaw += rdataSection.sizeOfRawData;

  const sizeOfImage = currentVA;

  // Now fill import structures with actual RVAs
  const importDescriptorRVA = rdataSection.virtualAddress + offDesc;
  const nameRVA = rdataSection.virtualAddress + offName;
  const hintNameRVA = rdataSection.virtualAddress + offHintName;
  const intRVA = rdataSection.virtualAddress + offINT;
  const iatRVA = rdataSection.virtualAddress + offIAT;

  // INT[0] -> RVA of hint/name, INT[1] = 0
  writeUint64LE(rdataSection.data, offINT, hintNameRVA);
  writeUint64LE(rdataSection.data, offINT + 8, 0);

  // IMAGE_IMPORT_DESCRIPTOR fields
  // OriginalFirstThunk (INT)
  writeUint32LE(rdataSection.data, offDesc + 0, intRVA);
  // TimeDateStamp
  writeUint32LE(rdataSection.data, offDesc + 4, 0);
  // ForwarderChain
  writeUint32LE(rdataSection.data, offDesc + 8, 0);
  // Name
  writeUint32LE(rdataSection.data, offDesc + 12, nameRVA);
  // FirstThunk (IAT)
  writeUint32LE(rdataSection.data, offDesc + 16, iatRVA);
  // Null descriptor already zeros

  // Patch call RIP-relative displacement in .text
  const callOffsetInText = 1 + 4; // after mov ecx,imm32 (1+4 bytes)
  const nextInstrRVA = textSection.virtualAddress + callOffsetInText + 6; // call is 6 bytes
  const disp32 = (iatRVA - nextInstrRVA) | 0; // signed
  writeUint32LE(textSection.data, callOffsetInText + 2, disp32 >>> 0);

  // Build final buffer
  const totalSize = currentRaw;
  const buf = new Uint8Array(totalSize);

  // DOS header & stub
  buf[0] = 0x4D; // 'M'
  buf[1] = 0x5A; // 'Z'
  // e_lfanew at 0x3C
  writeUint32LE(buf, 0x3C, dosStubSize);
  // simple DOS stub text (optional)
  const stubText = Buffer.from("This program cannot be run in DOS mode.\r\n$", "ascii");
  buf.set(stubText.subarray(0, Math.min(stubText.length, dosStubSize - 64)), 64);

  // PE signature
  buf.set(Buffer.from("PE\0\0", "ascii"), dosStubSize);

  // COFF header
  const coffStart = dosStubSize + peSigSize;
  writeUint16LE(buf, coffStart + 0, 0x8664); // Machine AMD64
  writeUint16LE(buf, coffStart + 2, numberOfSections);
  writeUint32LE(buf, coffStart + 4, Math.floor(Date.now() / 1000)); // timestamp
  writeUint32LE(buf, coffStart + 8, 0); // ptr to symbols
  writeUint32LE(buf, coffStart + 12, 0); // number of symbols
  writeUint16LE(buf, coffStart + 16, optionalHeaderSize);
  writeUint16LE(buf, coffStart + 18, 0x0002); // characteristics: executable

  // Optional header (PE32+)
  const optStart = coffStart + coffHeaderSize;
  writeUint16LE(buf, optStart + 0, 0x20B); // Magic PE32+
  buf[optStart + 2] = 14; // MajorLinkerVersion
  buf[optStart + 3] = 0;  // MinorLinkerVersion
  writeUint32LE(buf, optStart + 4, align(textSection.data.length, fileAlignment)); // SizeOfCode
  writeUint32LE(buf, optStart + 8, align(rdataSection.data.length, fileAlignment)); // SizeOfInitializedData
  const entryRVA = textSection.virtualAddress; // entry at start of .text
  writeUint32LE(buf, optStart + 12, entryRVA); // AddressOfEntryPoint
  writeUint32LE(buf, optStart + 16, textSection.virtualAddress); // BaseOfCode
  writeUint64LE(buf, optStart + 24, imageBase);
  writeUint32LE(buf, optStart + 32, sectionAlignment);
  writeUint32LE(buf, optStart + 36, fileAlignment);
  writeUint16LE(buf, optStart + 40, 6); // MajorOSVersion
  writeUint16LE(buf, optStart + 42, 0); // MinorOSVersion
  writeUint16LE(buf, optStart + 44, 0); // MajorImageVersion
  writeUint16LE(buf, optStart + 46, 0); // MinorImageVersion
  writeUint16LE(buf, optStart + 48, 6); // MajorSubsystemVersion
  writeUint16LE(buf, optStart + 50, 0); // MinorSubsystemVersion
  writeUint32LE(buf, optStart + 52, 0); // Win32VersionValue
  writeUint32LE(buf, optStart + 56, sizeOfImage);
  writeUint32LE(buf, optStart + 60, headersSize);
  writeUint32LE(buf, optStart + 64, 0); // CheckSum (optional)
  writeUint16LE(buf, optStart + 68, 3); // Subsystem: Windows CUI
  writeUint16LE(buf, optStart + 70, 0); // DllCharacteristics
  writeUint64LE(buf, optStart + 72, 0x400000); // SizeOfStackReserve
  writeUint64LE(buf, optStart + 80, 0x4000); // SizeOfStackCommit
  writeUint64LE(buf, optStart + 88, 0x100000); // SizeOfHeapReserve
  writeUint64LE(buf, optStart + 96, 0x2000); // SizeOfHeapCommit
  writeUint32LE(buf, optStart + 104, 0); // LoaderFlags
  writeUint32LE(buf, optStart + 108, 16); // NumberOfRvaAndSizes

  // Data directories (set import table and IAT)
  const ddStart = optStart + 112;
  // Export
  writeUint32LE(buf, ddStart + 0, 0); writeUint32LE(buf, ddStart + 4, 0);
  // Import
  writeUint32LE(buf, ddStart + 8, importDescriptorRVA); writeUint32LE(buf, ddStart + 12, 40); // approx size
  // Resource
  writeUint32LE(buf, ddStart + 16, 0); writeUint32LE(buf, ddStart + 20, 0);
  // Exception
  writeUint32LE(buf, ddStart + 24, 0); writeUint32LE(buf, ddStart + 28, 0);
  // Security
  writeUint32LE(buf, ddStart + 32, 0); writeUint32LE(buf, ddStart + 36, 0);
  // Relocation
  writeUint32LE(buf, ddStart + 40, 0); writeUint32LE(buf, ddStart + 44, 0);
  // Debug
  writeUint32LE(buf, ddStart + 48, 0); writeUint32LE(buf, ddStart + 52, 0);
  // Architecture
  writeUint32LE(buf, ddStart + 56, 0); writeUint32LE(buf, ddStart + 60, 0);
  // GlobalPtr
  writeUint32LE(buf, ddStart + 64, 0); writeUint32LE(buf, ddStart + 68, 0);
  // TLS
  writeUint32LE(buf, ddStart + 72, 0); writeUint32LE(buf, ddStart + 76, 0);
  // LoadConfig
  writeUint32LE(buf, ddStart + 80, 0); writeUint32LE(buf, ddStart + 84, 0);
  // BoundImport
  writeUint32LE(buf, ddStart + 88, 0); writeUint32LE(buf, ddStart + 92, 0);
  // IAT (index 12)
  writeUint32LE(buf, ddStart + 96, iatRVA); writeUint32LE(buf, ddStart + 100, 16);
  // DelayImport
  writeUint32LE(buf, ddStart + 104, 0); writeUint32LE(buf, ddStart + 108, 0);
  // COM Descriptor
  writeUint32LE(buf, ddStart + 112, 0); writeUint32LE(buf, ddStart + 116, 0);
  // Reserved
  writeUint32LE(buf, ddStart + 120, 0); writeUint32LE(buf, ddStart + 124, 0);

  // Section headers
  const secStart = optStart + optionalHeaderSize;

  function writeSectionHeader(idx: number, s: Section, characteristics: number) {
    const off = secStart + idx * sectionHeaderSize;
    // Name (8 bytes)
    const nameBuf = Buffer.from(s.name, "ascii");
    for (let i = 0; i < 8; i++) buf[off + i] = i < nameBuf.length ? nameBuf[i] : 0;
    writeUint32LE(buf, off + 8, s.virtualSize);
    writeUint32LE(buf, off + 12, s.virtualAddress);
    writeUint32LE(buf, off + 16, s.sizeOfRawData);
    writeUint32LE(buf, off + 20, s.pointerToRawData);
    writeUint32LE(buf, off + 24, 0); // PointerToRelocations
    writeUint32LE(buf, off + 28, 0); // PointerToLinenumbers
    writeUint16LE(buf, off + 32, 0); // NumberOfRelocations
    writeUint16LE(buf, off + 34, 0); // NumberOfLinenumbers
    writeUint32LE(buf, off + 36, characteristics);
  }

  // Characteristics
  const IMAGE_SCN_CNT_CODE = 0x00000020;
  const IMAGE_SCN_MEM_EXECUTE = 0x20000000;
  const IMAGE_SCN_MEM_READ = 0x40000000;
  const IMAGE_SCN_CNT_INITIALIZED_DATA = 0x00000040;

  writeSectionHeader(0, textSection, IMAGE_SCN_CNT_CODE | IMAGE_SCN_MEM_EXECUTE | IMAGE_SCN_MEM_READ);
  writeSectionHeader(1, rdataSection, IMAGE_SCN_CNT_INITIALIZED_DATA | IMAGE_SCN_MEM_READ);

  // Write section raw data
  buf.set(textSection.data, textSection.pointerToRawData);
  buf.set(rdataSection.data, rdataSection.pointerToRawData);

  return buf;
}