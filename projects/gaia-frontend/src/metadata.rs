use crate::exports::nyar::gaia_assembly::metadata::{PlatformInfo, ProgramMetadata, SymbolInfo, TargetArch};

pub struct MetadataImpl;

impl MetadataImpl {
    pub fn get_program_metadata(bytecode: Vec<u8>, target: TargetArch) -> ProgramMetadata {
        todo!()
    }

    pub fn get_symbol_info(bytecode: Vec<u8>, target: TargetArch) -> Vec<SymbolInfo> {
        todo!()
    }

    pub fn get_platform_info(target: TargetArch) -> PlatformInfo {
        todo!()
    }
}
