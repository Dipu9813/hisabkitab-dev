// Business API service utility
const API_BASE_URL = "http://localhost:3000";

export interface BusinessLoan {
  id: string;
  businessId: string;
  customerName: string;
  customerUserId?: string;
  customerProfilePic?: string;
  amount: number;
  description: string;
  isPaid: boolean;
  date: string;
  addedBy: string;
  addedById: string;
  addedByProfilePic?: string;
}

export interface Business {
  id: string;
  name: string;
  businessId: string;
  createdBy: string;
  createdAt: string;
  joinedAt?: string;
  isOwner: boolean;
}

export class BusinessService {
  private static getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  }

  // Create a new business
  static async createBusiness(name: string): Promise<Business> {
    const response = await fetch(`${API_BASE_URL}/business/create`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ name })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create business");
    }

    const data = await response.json();
    return data.business;
  }

  // Join an existing business
  static async joinBusiness(businessId: string): Promise<Business> {
    const response = await fetch(`${API_BASE_URL}/business/join`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ businessId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to join business");
    }

    const data = await response.json();
    return data.business;
  }

  // Get user's businesses
  static async getUserBusinesses(): Promise<Business[]> {
    const response = await fetch(`${API_BASE_URL}/business/my-businesses`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch businesses");
    }

    const data = await response.json();
    return data.data;
  }

  // Add a loan/credit entry for a customer
  static async addBusinessLoan(
    businessId: string,
    customerName: string,
    amount: number,
    description: string,
    customerUserId?: string
  ): Promise<BusinessLoan> {
    const response = await fetch(`${API_BASE_URL}/business/loan`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        businessId,
        customerName,
        customerUserId,
        amount,
        description
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to add loan");
    }

    const data = await response.json();
    return data.loan;
  }

  // Get loans for a specific business
  static async getBusinessLoans(
    businessId: string,
    isPaid?: boolean,
    limit = 50,
    offset = 0
  ): Promise<BusinessLoan[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    if (isPaid !== undefined) {
      params.append("isPaid", isPaid.toString());
    }

    const response = await fetch(
      `${API_BASE_URL}/business/${businessId}/loans?${params}`,
      {
        headers: this.getAuthHeaders()
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch loans");
    }

    const data = await response.json();
    return data.data;
  }

  // Mark a loan as paid/unpaid
  static async updateLoanStatus(loanId: string, isPaid: boolean): Promise<BusinessLoan> {
    const response = await fetch(`${API_BASE_URL}/business/loan/${loanId}/status`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ isPaid })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update loan status");
    }

    const data = await response.json();
    return data.loan;
  }

  // Get business members
  static async getBusinessMembers(businessId: string) {
    const response = await fetch(`${API_BASE_URL}/business/${businessId}/members`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch business members");
    }

    const data = await response.json();
    return data.members; // Changed from data.data to data.members
  }

  // Get all users (for team member selection)
  static async getAllUsers(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch users");
    }

    const data = await response.json();
    return data.data;
  }

  // Add member to business
  static async addBusinessMember(businessId: string, userId: string, role: string = 'member') {
    const response = await fetch(`${API_BASE_URL}/business/${businessId}/members`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ userId, role })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to add member");
    }

    const data = await response.json();
    return data.member;
  }

  // Remove member from business
  static async removeBusinessMember(businessId: string, userId: string) {
    const response = await fetch(`${API_BASE_URL}/business/${businessId}/members/${userId}`, {
      method: "DELETE",
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to remove member");
    }

    const data = await response.json();
    return data;
  }

  // Get total amount lent by business
  static async getBusinessTotalAmount(businessId: string): Promise<number> {
    try {
      const loans = await this.getBusinessLoans(businessId, false); // Get unpaid loans
      return loans.reduce((total, loan) => total + loan.amount, 0);
    } catch (error) {
      console.error("Error calculating business total:", error);
      return 0;
    }
  }
}
