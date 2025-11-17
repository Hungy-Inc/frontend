"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import { FaPrint, FaUtensils, FaCopy, FaCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function QRCodesPage() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push('/login');
          return;
        }

        // Get user info
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          router.push('/login');
          return;
        }

        const user = JSON.parse(userStr);
        
        // Fetch organization details (using same pattern as other pages)
        const orgRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organizations`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!orgRes.ok) {
          const errorData = await orgRes.json().catch(() => ({}));
          console.error('Failed to fetch organization:', orgRes.status, errorData);
          throw new Error(errorData.error || `Failed to fetch organization (${orgRes.status})`);
        }

        const organizations = await orgRes.json();
        
        if (!organizations || organizations.length === 0) {
          throw new Error("No organization found for the current user");
        }

        const org = organizations[0];
        if (!org || !org.name) {
          throw new Error("Invalid organization data received");
        }
        setOrganizationName(org.name);
        
        // Set base URL for QR codes - dynamically gets current domain
        const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
        setBaseUrl(currentUrl);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching organization:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load organization details';
        toast.error(errorMessage);
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [router]);

  const handlePrint = (index: number) => {
    if (!baseUrl || !organizationName) return;
    
    const qrCodes = [
      {
        name: 'Breakfast',
        shiftName: 'Breakfast',
        url: `${baseUrl}/meal-count/${organizationName}/breakfast`,
      },
      {
        name: 'Lunch',
        shiftName: 'Lunch',
        url: `${baseUrl}/meal-count/${organizationName}/lunch`,
      },
      {
        name: 'Supper',
        shiftName: 'Supper',
        url: `${baseUrl}/meal-count/${organizationName}/supper`,
      }
    ];

    const qr = qrCodes[index];
    
    // Get the QR code SVG from the DOM
    const qrElement = document.querySelector(`[data-qr-index="${index}"] svg`);
    if (!qrElement) {
      toast.error('QR code not found');
      return;
    }
    
    const qrSvg = qrElement.outerHTML;

    // Create a completely new window with only name and QR code
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${qr.name} QR Code</title>
          <style>
            @page {
              margin: 0;
              size: A4;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              width: 100%;
              height: 100%;
              background: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
            }
            .print-container {
              text-align: center;
              width: 100%;
              padding: 40px;
            }
            .qr-name {
              font-size: 48px;
              font-weight: bold;
              color: #000;
              margin-bottom: 50px;
            }
            .qr-code-wrapper {
              display: inline-block;
              background: white;
              padding: 20px;
            }
            .qr-code-wrapper svg {
              display: block;
              width: 400px;
              height: 400px;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="qr-name">${qr.name}</div>
            <div class="qr-code-wrapper">
              ${qrSvg}
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleCopyLink = async (url: string, index: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      toast.success('Link copied to clipboard!');
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!organizationName) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Organization not found</p>
        </div>
      </div>
    );
  }

  const qrCodes = [
    {
      name: 'Breakfast',
      shiftName: 'Breakfast',
      url: `${baseUrl}/meal-count/${organizationName}/breakfast`,
      color: 'bg-white',
      borderColor: 'border-gray-300',
      textColor: 'text-gray-900'
    },
    {
      name: 'Lunch',
      shiftName: 'Lunch',
      url: `${baseUrl}/meal-count/${organizationName}/lunch`,
      color: 'bg-white',
      borderColor: 'border-gray-300',
      textColor: 'text-gray-900'
    },
    {
      name: 'Supper',
      shiftName: 'Supper',
      url: `${baseUrl}/meal-count/${organizationName}/supper`,
      color: 'bg-white',
      borderColor: 'border-gray-300',
      textColor: 'text-gray-900'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 print:hidden">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FaUtensils className="text-blue-600" />
            Meal Counting QR Codes For Daily Meal Program
          </h1>
          <p className="text-gray-600 mt-2">Scan these QR codes to submit meal counts</p>
        </div>

        {/* QR Codes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {qrCodes.map((qr, index) => (
            <div
              key={index}
              data-qr-card-index={index}
              className={`${qr.color} ${qr.borderColor} border-2 rounded-lg p-6 shadow-lg print:shadow-none print:break-inside-avoid`}
            >
              <div className="text-center">
                <h2 className={`text-2xl font-bold mb-4 ${qr.textColor}`}>
                  {qr.name}
                </h2>
                
                {/* QR Code */}
                <div className="bg-white p-4 rounded-lg mb-4 inline-block" data-qr-index={index}>
                  <QRCode
                    value={qr.url}
                    size={200}
                    level="H"
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                  />
                </div>

                {/* Individual Print Button */}
                <div className="mt-4 print:hidden flex justify-center">
                  <button
                    onClick={() => handlePrint(index)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    <FaPrint />
                    Print This QR Code
                  </button>
                </div>

                {/* Copy Link Button */}
                {/* <div className="mt-4 mb-2">
                  <button
                    onClick={() => handleCopyLink(qr.url, index)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      copiedIndex === index
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    {copiedIndex === index ? (
                      <>
                        <FaCheck className="text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <FaCopy />
                        Copy Link
                      </>
                    )}
                  </button>
                </div> */}

                {/* URL Display */}
                {/* <div className="mb-3">
                  <p className="text-xs text-gray-500 break-all px-2">
                    {qr.url}
                  </p>
                </div> */}

                {/* Instructions */}
                <div className="mt-2 text-sm text-gray-700">
                  <p className="font-semibold mb-2">Scan to submit {qr.name.toLowerCase()} meal count</p>
                  <p className="text-xs text-gray-600">
                    Opens meal counting form for today
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions Section */}
        {/* <div className="mt-8 bg-white rounded-lg p-6 shadow-md print:hidden">
          <h3 className="text-xl font-bold text-gray-900 mb-4">How to Use</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Print this page or display it on a screen</li>
            <li>Users can scan the QR code with their phone camera</li>
            <li>The meal counting form will open automatically</li>
            <li>Users enter the number of meals served and submit</li>
            <li>If a meal count already exists for today, it will be displayed</li>
          </ol>
        </div> */}
      </div>

      {/* Print Styles - Only for general page printing, not individual QR codes */}
      <style jsx global>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

