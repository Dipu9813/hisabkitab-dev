"use client";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

export default function LoanHistory({ token }: { token: string }) {
  const [history, setHistory] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  
  // Get current user id from JWT
  let currentUserId = "";
  try {
    currentUserId = jwtDecode<{ sub: string }>(token).sub;
  } catch {}
  const fetchLoanHistory = async () => {
    setError("");
    try {
      const res = await fetch("http://localhost:3000/loan-history", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = `Error ${res.status}: ${res.statusText}`;
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If not JSON, use the raw text
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      // Check content type to avoid parsing HTML as JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }
      
      const data = await res.json();
      if (!data.data) {
        throw new Error('Invalid response format');
      }
      
      setHistory(data.data);
    } catch (err: any) {
      console.error("Error fetching loan history:", err);
      setError(err.message || "Failed to fetch loan history");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:3000/users", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      // Check content type to avoid parsing HTML as JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }
      
      const data = await res.json();
      if (res.ok && Array.isArray(data.data)) {
        const map: Record<string, string> = {};
        data.data.forEach((u: any) => { map[u.id] = u.full_name; });
        setUsers(map);
      }
    } catch (err: any) {
      console.error("Error fetching users:", err);
      // Don't set error state here to avoid UI confusion - just log it
    }
  };

  useEffect(() => { 
    fetchLoanHistory();
    fetchUsers();
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Loan History</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      
      {history.length === 0 ? (
        <div className="text-gray-500">No loan history available</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-left">Lender</th>
                <th className="py-2 px-3 text-left">Borrower</th>
                <th className="py-2 px-3 text-left">Amount</th>
                <th className="py-2 px-3 text-left">Remark</th>
                <th className="py-2 px-3 text-left">Loan Date</th>
                <th className="py-2 px-3 text-left">Payment Date</th>
                <th className="py-2 px-3 text-left">Type</th>
              </tr>
            </thead>
            <tbody>              {history.map(item => (
                <tr key={item.id} className="border-t">
                  <td className="py-2 px-3">
                    {item.lender?.full_name || users[item.lender_id] || 'Unknown'}
                  </td>
                  <td className="py-2 px-3">
                    {item.receiver?.full_name || users[item.receiver_id] || 'Unknown'}
                  </td>
                  <td className="py-2 px-3">${item.amount}</td>
                  <td className="py-2 px-3">{item.remark || 'No remark'}</td>
                  <td className="py-2 px-3">
                    {item.loan_date ? new Date(item.loan_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-2 px-3">
                    {item.payment_date ? new Date(item.payment_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-2 px-3">
                    {item.lender_id === currentUserId ? (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Lent</span>
                    ) : (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Borrowed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
