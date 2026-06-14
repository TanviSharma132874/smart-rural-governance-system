import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import apiClient from "../api/apiClient";
import FormField from "../components/common/FormField";
import LoaderPanel from "../components/common/LoaderPanel";
import StatusBadge from "../components/common/StatusBadge";

function CertificateVerificationPage() {
  const { id } = useParams();
  const [certificateNumber, setCertificateNumber] = useState(id || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      const autoVerify = async () => {
        setLoading(true);
        try {
          const response = await apiClient.get(`/certificates/verify/${id}`);
          setResult(response.data.data);
        } catch (err) {
          toast.error("Auto-verification failed. Registry entry may not exist.");
        } finally {
          setLoading(false);
        }
      };
      autoVerify();
    }
  }, [id]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!certificateNumber.trim()) return;

    setLoading(true);
    setResult(null);
    try {
      const response = await apiClient.get(`/certificates/verify/${certificateNumber.trim()}`);
      setResult(response.data.data);
    } catch (err) {
      toast.error("Verification failed. Please check the certificate number.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        <header className="text-center">
          <div className="mx-auto h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <svg className="h-10 w-10 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-leaf-600">Governance Integrity</p>
          <h1 className="mt-2 font-display text-4xl text-ink-950">Certificate Registry</h1>
          <p className="mt-3 text-slate-500">Public ledger for verifying government document authenticity.</p>
        </header>

        <section className="glass-panel rounded-[34px] border border-white/70 bg-white/90 p-8 shadow-2xl">
          <form onSubmit={handleVerify} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <FormField 
                label="Registry Reference / QR ID" 
                placeholder="e.g. BIRTH-2026-000001" 
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || !certificateNumber.trim()}
              className="mt-6 md:mt-0 self-end h-12 px-8 rounded-full bg-ink-950 text-white font-bold transition hover:bg-leaf-600 disabled:opacity-50 shadow-md"
            >
              {loading ? "Verifying..." : "Validate Record"}
            </button>
          </form>

          {loading && <div className="mt-12"><LoaderPanel label="Querying Registry..." /></div>}

          {result && (
            <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {result.status === "Invalid" ? (
                <div className="rounded-[28px] bg-rose-50 border border-rose-100 p-8 text-center">
                  <div className="mx-auto h-12 w-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="h-6 w-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-rose-900">Invalid Reference</h3>
                  <p className="mt-2 text-rose-800">The provided identifier was not found in the official registry.</p>
                </div>
              ) : (
                <div className={`rounded-[28px] border p-8 ${result.isValid ? 'bg-leaf-50 border-leaf-100' : 'bg-amber-50 border-amber-100 shadow-sm'}`}>
                   <div className="flex justify-between items-start mb-6 border-b border-slate-200/50 pb-4">
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Registry Status</p>
                        <div className="mt-1 flex items-center gap-2">
                           <StatusBadge value={result.status} />
                           {result.isValid && <span className="text-leaf-600 font-bold text-sm">Authentic & Valid</span>}
                        </div>
                      </div>
                      <div className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        Verified At: {new Date().toLocaleString("en-IN")}
                      </div>
                   </div>

                   <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Certificate Type</p>
                        <p className="mt-1 text-lg font-bold text-ink-950">{result.certificateType}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Official Number</p>
                        <p className="mt-1 text-lg font-mono font-bold text-ink-950">{result.certificateNumber}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issued To</p>
                        <p className="mt-1 text-lg font-bold text-ink-950">{result.issuedTo}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin Authority</p>
                        <p className="mt-1 text-lg font-bold text-ink-950">{result.department} ({result.district})</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Date</p>
                        <p className="mt-1 text-lg font-bold text-ink-950">{new Date(result.issuedAt).toLocaleDateString("en-IN")}</p>
                      </div>
                      {result.expiryDate && (
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Expiry</p>
                          <p className={`mt-1 text-lg font-bold ${new Date(result.expiryDate) < new Date() ? 'text-rose-600' : 'text-ink-950'}`}>
                            {new Date(result.expiryDate).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                      )}
                   </div>

                   <div className="mt-8 pt-6 border-t border-slate-200/50 flex items-center gap-3">
                      <svg className="h-5 w-5 text-leaf-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.9L10 1.554l7.834 3.346A2 2 0 0119 6.744v4.913a8 8 0 01-3.89 6.876l-5.11 2.96a2 2 0 01-2 0l-5.11-2.96A8 8 0 011 11.657V6.744a2 2 0 011.166-1.844zM10 11a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      <p className="text-[10px] text-slate-500 italic">This record is synchronized with the National Certificate Registry. Forgery of government documents is a punishable offense.</p>
                   </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default CertificateVerificationPage;
