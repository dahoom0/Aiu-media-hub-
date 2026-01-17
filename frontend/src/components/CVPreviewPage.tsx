// src/components/CVPreviewPage.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Download, Mail, Phone, MapPin, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import apiClient from '../services/apiClient';

interface Education {
  id: string;
  degree: string;
  institution: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Experience {
  id: string;
  position: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Skill {
  id: string;
  name: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

interface Language {
  id: string;
  name: string;
  proficiency: string;
}

interface Award {
  id: string;
  title: string;
  issuer: string;
  year: string;
  description: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  url?: string;
}

interface Reference {
  id: string;
  name: string;
  position: string;
  workplace: string;
  phone: string;
  email: string;
}

interface FormData {
  personal: {
    fullName: string;
    title: string;
    summary: string;
  };
  contact: {
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    website?: string;
  };
  education: Education[];
  experience: Experience[];
  skills: Skill[];
  certifications: Certification[];
  languages: Language[];
  awards: Award[];
  projects: Project[];
  references: Reference[];
}

interface CVPreviewPageProps {
  formData: FormData;
  photoUrl?: string;
  onBack: () => void;
}

const extractFilenameFromContentDisposition = (headerValue?: string | null) => {
  if (!headerValue) return null;
  // attachment; filename="abc.pdf"  OR  attachment; filename=abc.pdf  OR filename*=UTF-8''abc.pdf
  const m = /filename\*?=(?:UTF-8''|")?([^;"\n]+)"?/i.exec(headerValue);
  if (!m || !m[1]) return null;
  try {
    return decodeURIComponent(m[1].trim());
  } catch {
    return m[1].trim();
  }
};

// A4 size (CSS pixels) is variable depending on DPI; for screen preview we use mm-based sizing.
// 210mm x 297mm is true A4. We also support "fit to width" scaling via container.
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

export const CVPreviewPage: React.FC<CVPreviewPageProps> = ({
  formData,
  photoUrl,
  onBack,
}) => {
  const cvRef = useRef<HTMLDivElement | null>(null);

  // PDF preview state
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string>('');

  // Use your existing backend endpoint (do not rename)
  const pdfEndpoint = '/cvs/my/download-pdf/';

  const safeDownloadFilename = useMemo(() => {
    const safeName = (formData.personal.fullName || 'cv').trim().replace(/\s+/g, '_');
    return `${safeName}.pdf`;
  }, [formData.personal.fullName]);

  const revokePdfUrl = (url?: string) => {
    if (!url) return;
    try {
      window.URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  const fetchPdfPreview = async () => {
    setPdfLoading(true);
    setPdfError('');

    // cleanup previous url
    setPdfUrl((old) => {
      revokePdfUrl(old);
      return '';
    });

    try {
      const res = await apiClient.get(pdfEndpoint, { responseType: 'blob' });

      const contentType =
        (res?.headers?.['content-type'] as string) || 'application/pdf';

      const blob = new Blob([res.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error('PDF preview failed:', err);
      setPdfError('Failed to load PDF preview. Showing HTML preview instead.');
      setPdfUrl('');
    } finally {
      setPdfLoading(false);
    }
  };

  // Load PDF preview on mount
  useEffect(() => {
    fetchPdfPreview();
    // cleanup on unmount
    return () => {
      setPdfUrl((old) => {
        revokePdfUrl(old);
        return '';
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Download from backend (not html2canvas)
  const handleDownloadPDF = async () => {
    try {
      const res = await apiClient.get(pdfEndpoint, {
        responseType: 'blob',
      });

      const contentType =
        (res?.headers?.['content-type'] as string) || 'application/pdf';
      const cd = (res?.headers?.['content-disposition'] as string) || '';
      const serverFilename = extractFilenameFromContentDisposition(cd);

      const filename = serverFilename || safeDownloadFilename;

      const blob = new Blob([res.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed:', err);
      alert('Failed to download PDF. Please try again.');
    }
  };

  // -------------------------
  // HTML PREVIEW (Fallback)
  // -------------------------
  const HtmlPreview = (
    <Card
      ref={cvRef}
      className="bg-white border border-gray-200 rounded-2xl shadow-sm px-12 py-10"
    >
      {/* Header with photo + name */}
      <div className="flex items-center mb-6">
        {photoUrl && (
          <div className="mr-8">
            <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-300">
              <img
                src={photoUrl}
                alt={formData.personal.fullName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        <div className="flex-1 text-center">
          <h1 className="text-2xl font-semibold tracking-[0.15em] text-gray-900">
            {formData.personal.fullName || 'FULL NAME'}
          </h1>
          <p className="mt-1 text-sm uppercase tracking-[0.25em] text-gray-700">
            {formData.personal.title || 'JOB TITLE'}
          </p>

          <div className="mt-5 flex items-center justify-center gap-6 text-xs text-gray-700">
            {formData.contact.email && (
              <div className="inline-flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span>{formData.contact.email}</span>
              </div>
            )}
            {formData.contact.phone && (
              <div className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{formData.contact.phone}</span>
              </div>
            )}
            {formData.contact.location && (
              <div className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{formData.contact.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 my-6" />

      {/* Main content: two columns like your sample */}
      <div className="grid grid-cols-2 gap-12 text-[13px] leading-relaxed text-gray-900">
        {/* LEFT COLUMN */}
        <div>
          {/* PROFILE */}
          {formData.personal.summary && (
            <section className="mb-8">
              <h2 className="font-semibold tracking-wide text-[13px] mb-2">
                PROFILE
              </h2>
              <p className="text-[12px] leading-relaxed text-gray-800">
                {formData.personal.summary}
              </p>
            </section>
          )}

          {/* LANGUAGES */}
          {formData.languages.length > 0 && (
            <section className="mb-8">
              <h2 className="font-semibold tracking-wide text-[13px] mb-2">
                LANGUAGES
              </h2>
              <div className="space-y-1 text-[12px]">
                {formData.languages.map((lang) => (
                  <p key={lang.id}>
                    {lang.name.toLowerCase()} – {lang.proficiency}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* AWARDS */}
          {formData.awards.length > 0 && (
            <section className="mb-4">
              <h2 className="font-semibold tracking-wide text-[13px] mb-2">
                AWARDS &amp; ACHIEVEMENTS
              </h2>
              <div className="space-y-3 text-[12px]">
                {formData.awards.map((award) => (
                  <div key={award.id}>
                    <p className="font-semibold">{award.title}</p>
                    {(award.issuer || award.year) && (
                      <p className="text-gray-700">
                        {award.issuer && <span>{award.issuer}</span>}
                        {award.issuer && award.year && <span> • </span>}
                        {award.year && <span>{award.year}</span>}
                      </p>
                    )}
                    {award.description && (
                      <p className="text-gray-800">{award.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* EDUCATION */}
          {formData.education.length > 0 && (
            <section className="mb-6">
              <h2 className="font-semibold tracking-wide text-[13px] mb-2">
                EDUCATION
              </h2>
              {formData.education.map((edu) => (
                <div key={edu.id} className="mb-3 text-[12px]">
                  <p className="font-semibold">{edu.degree}</p>
                  <p className="text-gray-700">{edu.institution}</p>
                  {(edu.startDate || edu.endDate) && (
                    <p className="text-gray-700">
                      {edu.startDate?.slice(0, 7).replace('-', '–')} –{' '}
                      {edu.endDate?.slice(0, 7).replace('-', '–')}
                    </p>
                  )}
                  {edu.description && (
                    <p className="text-gray-800">{edu.description}</p>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* EXPERIENCE */}
          {formData.experience.length > 0 && (
            <section className="mb-6">
              <h2 className="font-semibold tracking-wide text-[13px] mb-2">
                EXPERIENCE
              </h2>
              {formData.experience.map((exp) => (
                <div key={exp.id} className="mb-3 text-[12px]">
                  <p className="font-semibold">{exp.position}</p>
                  <p className="text-gray-700">{exp.company}</p>
                  {(exp.startDate || exp.endDate) && (
                    <p className="text-gray-700">
                      {exp.startDate?.slice(0, 7).replace('-', '–')} –{' '}
                      {exp.endDate?.slice(0, 7).replace('-', '–')}
                    </p>
                  )}
                  {exp.description && (
                    <p className="text-gray-800">{exp.description}</p>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* PROJECTS */}
          {formData.projects.length > 0 && (
            <section className="mb-2">
              <h2 className="font-semibold tracking-wide text-[13px] mb-2">
                PROJECTS
              </h2>
              {formData.projects.map((proj) => (
                <div key={proj.id} className="mb-3 text-[12px]">
                  <p className="font-semibold">{proj.name}</p>
                  {proj.description && (
                    <p className="text-gray-800">{proj.description}</p>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#EBF2FA] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Editor
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={fetchPdfPreview}
              className="border-gray-300 text-gray-800"
              disabled={pdfLoading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Refresh Preview
            </Button>

            <Button
              onClick={handleDownloadPDF}
              className="bg-teal-500 hover:bg-teal-600 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* ✅ A4 PDF Preview Frame */}
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[980px]">
            <div className="rounded-2xl border border-gray-200 bg-white/40 p-4 shadow-sm">
              <div className="text-sm text-gray-700 mb-3">
                Preview (A4)
                {pdfLoading && <span className="ml-2 text-gray-500">Loading…</span>}
              </div>

              {/* Paper viewport */}
              <div className="w-full overflow-auto">
                {/* A4 paper wrapper */}
                <div
                  className="mx-auto bg-white shadow-md border border-gray-200"
                  style={{
                    width: `${A4_WIDTH_MM}mm`,
                    minHeight: `${A4_HEIGHT_MM}mm`,
                  }}
                >
                  {/* Inner page margins like a PDF */}
                  <div className="w-full h-full">
                    {pdfUrl ? (
                      <iframe
                        title="CV PDF Preview"
                        src={pdfUrl}
                        className="w-full"
                        style={{
                          height: `${A4_HEIGHT_MM}mm`,
                          border: 'none',
                        }}
                      />
                    ) : (
                      <div className="p-6">
                        {pdfError ? (
                          <div className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            {pdfError}
                          </div>
                        ) : (
                          <div className="mb-4 text-sm text-gray-600">
                            PDF preview is not available right now. Showing HTML preview.
                          </div>
                        )}

                        {/* fallback to your existing HTML preview */}
                        {HtmlPreview}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Helper note */}
              <div className="mt-3 text-xs text-gray-600">
                Tip: If the PDF preview appears blank, click <span className="font-semibold">Refresh Preview</span>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
