export enum CompanyStatus {
  PENDING = 'pending',        // Awaiting admin approval
  ACTIVE = 'active',          // Approved and active
  SUSPENDED = 'suspended',    // Temporarily suspended
  INACTIVE = 'inactive',      // Voluntarily inactive
  REJECTED = 'rejected'       // Registration rejected
}