export enum WorkerCategory {
    OUVRIER = 'ouvrier',
    EMPLOYE = 'employe',
    AGENT_MAITRISE = 'agent_maitrise',
    CADRE = 'cadre',
}

export enum ContractType {
    CDI = 'cdi',
    CDD = 'cdd',
}

export enum TerminationReason {
    LICENCIEMENT = 'licenciement',
    DEMISSION = 'demission',
    RUPTURE_NEGOCIEE = 'rupture_negociee',
    FIN_CONTRAT = 'fin_contrat',
}

export interface CalculationRequest {
    id: string;
    employee_name: string;
    employee_email?: string;
    start_date: string;
    end_date: string;
    avg_salary: number;
    category: WorkerCategory;
    contract_type: ContractType;
    termination_reason?: TerminationReason;
    remaining_leave_days: number;
    status: string;
    created: string;
}
