export enum CompanyStatus {
  PENDING = 'PENDING',        // Awaiting admin approval
  ACTIVE = 'ACTIVE',          // Approved and active
  SUSPENDED = 'SUSPENDED',    // Temporarily suspended
  INACTIVE = 'INACTIVE',      // Voluntarily inactive
  REJECTED = 'REJECTED'       // Registration rejected
}