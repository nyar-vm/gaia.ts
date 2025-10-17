use crate::exports::nyar::gaia_assembly::assembler::{Diagnostic, DisassembleResult, InstructionMetadata, TargetArch};

pub struct AssemblerImpl;

impl AssemblerImpl {
    pub fn assemble(source: String, target: TargetArch, optimize: bool, debug: bool) -> Result<(), ()> {
        todo!()
    }

    pub fn get_supported_targets() -> Vec<TargetArch> {
        todo!()
    }

    pub fn validate_syntax(source: String) -> Vec<Diagnostic> {
        todo!()
    }

    pub fn get_instruction_set(target: TargetArch) -> Vec<InstructionMetadata> {
        todo!()
    }

    pub fn disassemble(bytecode: Vec<u8>, target: TargetArch) -> DisassembleResult {
        todo!()
    }
}
