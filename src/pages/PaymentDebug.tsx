import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const PaymentDebug = () => {
  const [searchParams] = useSearchParams();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const allParams = Object.fromEntries(searchParams.entries());
  const orderId = searchParams.get('order_id');
  const paymentSessionId = searchParams.get('payment_session_id');

  const testPaymentVerification = async () => {
    if (!paymentSessionId || !orderId) {
      alert('Missing required parameters');
      return;
    }

    setLoading(true);
    try {
      const isLocalDev = window.location.hostname === 'localhost';
      const apiBaseUrl = isLocalDev 
        ? "http://localhost:3001" 
        : "https://kwsqhrqhtcuacfvmxwji.supabase.co";
        
      const response = await fetch(
        `${apiBaseUrl}/functions/v1/verify-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(isLocalDev ? {} : { 
              "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3c3FocnFodGN1YWNmdm14d2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NDEyNTgsImV4cCI6MjA2OTExNzI1OH0.w677z2scEUSeLvsVqA3pPBUx0TihKB3LP1QuedLgqvQ` 
            }),
          },
          body: JSON.stringify({
            payment_session_id: paymentSessionId,
            order_id: orderId,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPaymentData(data);
      } else {
        const error = await response.text();
        setPaymentData({ error: `HTTP ${response.status}: ${error}` });
      }
    } catch (error) {
      setPaymentData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const analyzePaymentStatus = () => {
    if (!paymentData) return null;

    const isPaid = paymentData.order_status === 'PAID' || 
                  paymentData.payment_status === 'SUCCESS' ||
                  paymentData.order_status === 'ACTIVE';
    
    const isCancelled = paymentData.order_status === 'CANCELLED' ||
                       paymentData.payment_status === 'CANCELLED' ||
                       paymentData.order_status === 'FAILED' ||
                       paymentData.payment_status === 'FAILED' ||
                       paymentData.order_status === 'EXPIRED' ||
                       paymentData.payment_status === 'USER_DROPPED' ||
                       paymentData.order_status === 'TERMINATED' ||
                       paymentData.payment_status === 'TERMINATED';
    
    const isUnpaid = paymentData.order_status === 'CREATED' || 
                    paymentData.order_status === 'PENDING' ||
                    paymentData.payment_status === 'PENDING' ||
                    !paymentData.payment_status ||
                    !paymentData.order_status;

    return { isPaid, isCancelled, isUnpaid };
  };

  const analysis = analyzePaymentStatus();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Payment Debug Page</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>URL Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(allParams, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Verification Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testPaymentVerification}
              disabled={loading || !paymentSessionId || !orderId}
            >
              {loading ? 'Testing...' : 'Test Payment Verification'}
            </Button>
            
            {paymentData && (
              <div>
                <h3 className="font-semibold mb-2">Payment Data Response:</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(paymentData, null, 2)}
                </pre>
                
                {analysis && (
                  <div className="mt-4 p-4 border rounded">
                    <h4 className="font-semibold mb-2">Analysis:</h4>
                    <div className="space-y-1">
                      <div className={`p-2 rounded ${analysis.isPaid ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                        ✅ Is Paid: {analysis.isPaid ? 'YES' : 'NO'}
                      </div>
                      <div className={`p-2 rounded ${analysis.isCancelled ? 'bg-orange-100 text-orange-800' : 'bg-gray-100'}`}>
                        🚫 Is Cancelled: {analysis.isCancelled ? 'YES' : 'NO'}
                      </div>
                      <div className={`p-2 rounded ${analysis.isUnpaid ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'}`}>
                        ⏳ Is Unpaid: {analysis.isUnpaid ? 'YES' : 'NO'}
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 border-l-4 border-blue-500 bg-blue-50">
                      <strong>Recommendation:</strong>
                      {analysis.isPaid && ' This should show SUCCESS'}
                      {analysis.isCancelled && ' This should show CANCELLED'}
                      {analysis.isUnpaid && !analysis.isCancelled && ' This should show CANCELLED (unpaid)'}
                      {!analysis.isPaid && !analysis.isCancelled && !analysis.isUnpaid && ' This should show FAILED'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test URLs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Test Cancelled Payment:</h4>
                <div className="bg-gray-100 p-2 rounded text-sm font-mono break-all">
                  {window.location.origin}/order-success?order_id={orderId || 'YOUR_ORDER_ID'}&payment_session_id={paymentSessionId || 'SESSION_ID'}&cancelled=true
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold">Test Success Payment:</h4>
                <div className="bg-gray-100 p-2 rounded text-sm font-mono break-all">
                  {window.location.origin}/order-success?order_id={orderId || 'YOUR_ORDER_ID'}&payment_session_id={paymentSessionId || 'SESSION_ID'}&status=SUCCESS
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center">
          <Button onClick={() => window.location.href = '/'}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDebug;
