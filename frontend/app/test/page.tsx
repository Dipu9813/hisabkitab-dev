import TransactionSuccess from "@/components/transaction-success";

export default function TestPage() {
    return (
        <TransactionSuccess
            amount="1000"
            recipient="John Doe"
            mobileNumber="1234567890"
            remarks="Test transaction"
           
        />
    );
}
