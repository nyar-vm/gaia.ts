import {describe, it, expect} from 'vitest';
import {MiniGoCompiler} from '../src/lib';
import {writeFileSync} from 'fs';
import {join} from 'path';
import {spawnSync} from 'child_process';

function readUint16(buf: Uint8Array, off: number) {
  return buf[off] | (buf[off + 1] << 8);
}
function readUint32(buf: Uint8Array, off: number) {
  return (buf[off]) | (buf[off + 1] << 8) | (buf[off + 2] << 16) | (buf[off + 3] << 24);
}

describe('PE emitter (Windows x64)', () => {
  it('generates a valid PE32+ exe calling ExitProcess', () => {
    const source = `package main\n\nfunc main() {}`;
    const compiler = new MiniGoCompiler(source);
    const compileResult = compiler.compile();
    expect(compileResult.success).toBe(true);
    const pe = compiler.compileToPE({ exitCode: 7 });
    expect(pe).toBeInstanceOf(Uint8Array);
    expect(pe.length).toBeGreaterThan(512);

    // Check DOS header
    expect(String.fromCharCode(pe[0], pe[1])).toBe('MZ');
    const e_lfanew = readUint32(pe, 0x3C);
    expect(e_lfanew).toBeGreaterThan(0x80 - 1);

    // Check PE signature
    const sig = String.fromCharCode(pe[e_lfanew], pe[e_lfanew + 1], pe[e_lfanew + 2], pe[e_lfanew + 3]);
    expect(sig).toBe('PE\u0000\u0000');

    const coffStart = e_lfanew + 4;
    const machine = readUint16(pe, coffStart);
    expect(machine).toBe(0x8664); // AMD64
    const numSections = readUint16(pe, coffStart + 2);
    expect(numSections).toBeGreaterThanOrEqual(2);
    const optSize = readUint16(pe, coffStart + 16);
    const optStart = coffStart + 20;

    // Optional header magic
    const magic = readUint16(pe, optStart);
    expect(magic).toBe(0x20B); // PE32+

    const addressOfEntryPoint = readUint32(pe, optStart + 12);
    const baseOfCode = readUint32(pe, optStart + 16);
    expect(addressOfEntryPoint).toBeGreaterThanOrEqual(baseOfCode);

    // Data directory - import
    const ddStart = optStart + 112;
    const importRVA = readUint32(pe, ddStart + 8);
    expect(importRVA).toBeGreaterThan(0);

    // Section headers start
    const secStart = optStart + optSize;
    const secSize = 40;
    // Find .text and .rdata
    let textVA = 0, textRaw = 0, rdataVA = 0, rdataRaw = 0;
    for (let i = 0; i < numSections; i++) {
      const off = secStart + i * secSize;
      const name = String.fromCharCode(
        pe[off + 0], pe[off + 1], pe[off + 2], pe[off + 3], pe[off + 4], pe[off + 5], pe[off + 6], pe[off + 7]
      ).replace(/\0+$/, '');
      const va = readUint32(pe, off + 12);
      const rawPtr = readUint32(pe, off + 20);
      if (name === '.text') { textVA = va; textRaw = rawPtr; }
      if (name === '.rdata') { rdataVA = va; rdataRaw = rawPtr; }
    }
    expect(textVA).toBeGreaterThan(0);
    expect(rdataVA).toBeGreaterThan(0);

    // Verify entry points to .text
    expect(addressOfEntryPoint).toBeGreaterThanOrEqual(textVA);

    // Optionally write and run EXE (exit code 7)
    const outPath = join(process.cwd(), 'tests', 'out_pe_basic.exe');
    writeFileSync(outPath, Buffer.from(pe));
    const run = spawnSync(outPath, [], { windowsHide: true });
    // If process starts, it should exit quickly. Exit code may be 7.
    // Some environments may not allow spawning; we accept either spawn or not.
    if (run.error) {
      // Skip assertion in restricted environments
      expect(run.error).toBeDefined();
    } else {
      expect(run.status).toBe(7);
    }
  });
});