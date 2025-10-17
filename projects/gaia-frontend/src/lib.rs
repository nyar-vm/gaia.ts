mod assembler;
mod easy_test;
mod metadata;
mod utils;

wit_bindgen::generate!({
    world: "gaia-assembly",
});

use crate::exports::nyar::gaia_assembly::assembler::{Guest as AssemblerGuest, Diagnostic, InstructionMetadata, DisassembleResult, TargetArch};
use crate::exports::nyar::gaia_assembly::metadata::{Guest as MetadataGuest, ProgramMetadata, SymbolInfo, PlatformInfo, TargetArch as MetadataTargetArch};
use crate::exports::nyar::gaia_assembly::utils::Guest as UtilsGuest;
use crate::exports::nyar::gaia_assembly::easy_test::{Guest as EasyTestGuest, TargetArch as EasyTestTargetArch};

struct Component;

impl AssemblerGuest for Component {
    fn assemble(source: String, target: TargetArch, optimize: bool, debug: bool) -> Result<(), ()> {
        assembler::AssemblerImpl::assemble(source, target, optimize, debug)
    }

    fn get_supported_targets() -> Vec<TargetArch> {
        assembler::AssemblerImpl::get_supported_targets()
    }

    fn validate_syntax(source: String) -> Vec<Diagnostic> {
        assembler::AssemblerImpl::validate_syntax(source)
    }

    fn get_instruction_set(target: TargetArch) -> Vec<InstructionMetadata> {
        assembler::AssemblerImpl::get_instruction_set(target)
    }

    fn disassemble(bytecode: Vec<u8>, target: TargetArch) -> DisassembleResult {
        assembler::AssemblerImpl::disassemble(bytecode, target)
    }
}

impl MetadataGuest for Component {
    fn get_program_metadata(bytecode: Vec<u8>, target: MetadataTargetArch) -> ProgramMetadata {
        metadata::MetadataImpl::get_program_metadata(bytecode, target)
    }

    fn get_symbol_info(bytecode: Vec<u8>, target: MetadataTargetArch) -> Vec<SymbolInfo> {
        metadata::MetadataImpl::get_symbol_info(bytecode, target)
    }

    fn get_platform_info(target: MetadataTargetArch) -> PlatformInfo {
        metadata::MetadataImpl::get_platform_info(target)
    }
}

impl UtilsGuest for Component {
    fn get_version() -> String {
        utils::UtilsImpl::get_version()
    }
}

impl EasyTestGuest for Component {
    fn generate_exit_code(code: u32, target: EasyTestTargetArch) -> Vec<u8> {
        easy_test::EasyTestImpl::generate_exit_code(code, target)
    }

    fn generate_console_log(message: String, target: EasyTestTargetArch) -> Vec<u8> {
        easy_test::EasyTestImpl::generate_console_log(message, target)
    }
}

export!(Component);
