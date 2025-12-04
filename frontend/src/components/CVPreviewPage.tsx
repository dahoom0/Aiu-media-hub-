import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ArrowLeft, Download, Mail, Phone, MapPin, Globe, Linkedin, Calendar } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface CVPreviewPageProps {
  formData: any;
  onBack: () => void;
}

export function CVPreviewPage({ formData, onBack }: CVPreviewPageProps) {
  const { theme } = useTheme();

  const handleDownload = () => {
    // Mock download functionality
    alert('CV download functionality would be implemented here. This would generate a PDF from the CV data.');
  };

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-950'} p-6`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className={theme === 'light' ? 'text-gray-700 hover:bg-gray-200' : 'text-gray-300 hover:bg-gray-800'}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Editor
          </Button>
          <Button
            onClick={handleDownload}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>

        {/* CV Preview */}
        <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
          <CardContent className="p-8 md:p-12">
            {/* Header Section */}
            <div className="border-b pb-6 mb-6" style={{ borderColor: theme === 'light' ? '#e5e7eb' : '#374151' }}>
              <h1 className={`mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {formData.personal?.fullName || 'Your Name'}
              </h1>
              <p className={`mb-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                {formData.personal?.title || 'Professional Title'}
              </p>

              {/* Contact Information */}
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                {formData.contact?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-teal-500" />
                    <span>{formData.contact.email}</span>
                  </div>
                )}
                {formData.contact?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-teal-500" />
                    <span>{formData.contact.phone}</span>
                  </div>
                )}
                {formData.contact?.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-teal-500" />
                    <span>{formData.contact.location}</span>
                  </div>
                )}
                {formData.contact?.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-teal-500" />
                    <span>{formData.contact.website}</span>
                  </div>
                )}
                {formData.contact?.linkedin && (
                  <div className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-teal-500" />
                    <span>{formData.contact.linkedin}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Professional Summary */}
            {formData.personal?.summary && (
              <div className="mb-6">
                <h2 className={`mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  Professional Summary
                </h2>
                <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                  {formData.personal.summary}
                </p>
              </div>
            )}

            {/* Education */}
            {formData.education && formData.education.length > 0 && (
              <div className="mb-6">
                <h2 className={`mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  Education
                </h2>
                <div className="space-y-4">
                  {formData.education.map((edu: any) => (
                    <div key={edu.id}>
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h3 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                            {edu.degree}
                          </h3>
                          <p className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                            {edu.institution}
                          </p>
                        </div>
                        <div className={`text-sm flex items-center gap-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                          <Calendar className="h-3 w-3" />
                          <span>{edu.startDate} - {edu.endDate}</span>
                        </div>
                      </div>
                      {edu.description && (
                        <p className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                          {edu.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {formData.experience && formData.experience.length > 0 && (
              <div className="mb-6">
                <h2 className={`mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  Experience
                </h2>
                <div className="space-y-4">
                  {formData.experience.map((exp: any) => (
                    <div key={exp.id}>
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h3 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                            {exp.position}
                          </h3>
                          <p className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                            {exp.company}
                          </p>
                        </div>
                        <div className={`text-sm flex items-center gap-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                          <Calendar className="h-3 w-3" />
                          <span>{exp.startDate} - {exp.endDate}</span>
                        </div>
                      </div>
                      {exp.description && (
                        <p className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {formData.skills && formData.skills.length > 0 && (
              <div className="mb-6">
                <h2 className={`mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill: any) => (
                    <span
                      key={skill.id}
                      className={`px-3 py-1 rounded-full text-sm ${
                        theme === 'light'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-teal-500/20 text-teal-400'
                      }`}
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {formData.certifications && formData.certifications.length > 0 && (
              <div className="mb-6">
                <h2 className={`mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  Certifications
                </h2>
                <div className="space-y-3">
                  {formData.certifications.map((cert: any) => (
                    <div key={cert.id}>
                      <h3 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                        {cert.name}
                      </h3>
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                        {cert.issuer} {cert.year && `• ${cert.year}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {formData.languages && formData.languages.length > 0 && (
              <div className="mb-6">
                <h2 className={`mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  Languages
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {formData.languages.map((lang: any) => (
                    <div key={lang.id}>
                      <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                        {lang.name}
                      </p>
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        {lang.proficiency}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Awards */}
            {formData.awards && formData.awards.length > 0 && (
              <div className="mb-6">
                <h2 className={`mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  Awards & Achievements
                </h2>
                <div className="space-y-3">
                  {formData.awards.map((award: any) => (
                    <div key={award.id}>
                      <h3 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                        {award.title}
                      </h3>
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                        {award.issuer} {award.year && `• ${award.year}`}
                      </p>
                      {award.description && (
                        <p className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                          {award.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {formData.projects && formData.projects.length > 0 && (
              <div className="mb-6">
                <h2 className={`mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  Projects
                </h2>
                <div className="space-y-4">
                  {formData.projects.map((project: any) => (
                    <div key={project.id}>
                      <h3 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                          {project.description}
                        </p>
                      )}
                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-teal-500 hover:text-teal-400 mt-1 inline-block"
                        >
                          View Project →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
