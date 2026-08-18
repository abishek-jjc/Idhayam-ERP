-- =====================================================================
-- Idhayam ERP v3 - SQL Script to Truncate Process Engine & Related Tables
-- Database: PostgreSQL
-- =====================================================================

-- Option 1: Truncate ALL Process Instances, Attributes, Links, Verifications & Workflow Proposals
-- (This removes all operational process data while preserving Process Type schemas)

TRUNCATE TABLE 
    process_engine_processattributevalue,
    process_engine_processlink,
    process_engine_adminverification,
    workflow_approvalstep,
    workflow_proposalamendment,
    workflow_proposalvendorquotation,
    workflow_proposal,
    process_engine_processinstance
CASCADE;

-- Option 2: Complete Truncate of All Process Engine Tables including Schemas & Definitions
-- (Uncomment lines below if you also want to remove Process Types & Attribute Definitions)

/*
TRUNCATE TABLE 
    process_engine_processattributevalue,
    process_engine_processlink,
    process_engine_adminverification,
    workflow_approvalstep,
    workflow_proposalamendment,
    workflow_proposalvendorquotation,
    workflow_proposal,
    process_engine_processinstance,
    process_engine_processattributedefinition,
    process_engine_processtype,
    workflow_approvalchaintemplate
CASCADE;
*/
