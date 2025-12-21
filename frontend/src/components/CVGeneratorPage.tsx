import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useTheme } from './ThemeProvider';
import { CVPreviewPage } from './CVPreviewPage';
import { ImageCropDialog } from './ImageCropDialog';
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Code,
  Award,
  Globe,
  Trophy,
  FolderOpen,
  FileText,
  Upload,
  Trash2,
  Plus,
  X,
  Download,
  Users,
  Loader2,
} from 'lucide-react';

import cvService from '../services/cvService';
import authService from '../services/authService';

type Step =
  | 'personal'
  | 'contact'
  | 'education'
  | 'experience'
  | 'skills'
  | 'certifications'
  | 'languages'
  | 'awards'
  | 'projects'
  | 'references'
  | 'photo'
  | 'generate';

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
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string; // year/month
}

interface Language {
  id: string;
  language: string;
  proficiency: string;
}

interface AwardType {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string;
}

interface Reference {
  id: string;
  name: string;
  position: string;
  workplace: string;
  phone: string;
  email: string;
}

export function CVGeneratorPage() {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState<Step>('personal');

  // --- Backend Integration State ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cvId, setCvId] = useState<number | null>(null);

  // Personal Details State
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');

  // Contact Info State
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');

  // Education State
  const [education, setEducation] = useState<Education[]>([]);

  // Experience State
  const [experiences, setExperiences] = useState<Experience[]>([]);

  // Skills State
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // Certifications State
  const [certifications, setCertifications] = useState<Certification[]>([]);

  // Languages State
  const [languages, setLanguages] = useState<Language[]>([]);

  // Awards State
  const [awards, setAwards] = useState<AwardType[]>([]);

  // Projects State
  const [projects, setProjects] = useState<Project[]>([]);

  // References State
  const [references, setReferences] = useState<Reference[]>([]);

  // Photo State (this should reflect CV.profile_image)
  const [profilePhoto, setProfilePhoto] = useState('');
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

  // Preview State
  const [showPreview, setShowPreview] = useState(false);

  const proficiencyLevels = ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic'];

  // --- FETCH DATA ON MOUNT ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Get User Profile (for defaults)
        const userRes = await authService.getProfile();
        const u = userRes.user || userRes;

        // 2. Get CV Data
        const cvData = await cvService.getMyCV();

        if (cvData) {
          setCvId(cvData.id);

          // Personal
          setFullName(
            cvData.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim()
          );
          setHeadline(cvData.title || '');
          setSummary(cvData.summary || '');

          // Contact
          setEmail(cvData.email || u.email || '');
          setPhone(cvData.phone || u.phone || '');
          setLocation(cvData.location || '');
          setLinkedin(cvData.linkedin || '');
          setWebsite(cvData.portfolio_website || '');

          // CV profile image is the main source for photo
          if (cvData.profile_image) {
            setProfilePhoto(cvData.profile_image);
          } else if (u.profile_picture) {
            // optional fallback from user photo if CV doesn't have one yet
            setProfilePhoto(u.profile_picture);
          }

          // Education
          if (cvData.education) {
            setEducation(
              cvData.education.map((e: any) => ({
                id: e.id.toString(),
                degree: e.degree,
                institution: e.institution,
                startDate: e.start_date,
                endDate: e.end_date,
                description: e.description || '',
              }))
            );
          }

          // Experience
          if (cvData.experience) {
            setExperiences(
              cvData.experience.map((e: any) => ({
                id: e.id.toString(),
                position: e.position,
                company: e.company,
                location: e.location || '',
                startDate: e.start_date,
                endDate: e.end_date,
                description: e.description || '',
              }))
            );
          }

          // Skills
          if (cvData.skills) {
            setSkills(cvData.skills.map((s: any) => s.name));
          }

          // Projects
          if (cvData.projects) {
            setProjects(
              cvData.projects.map((p: any) => ({
                id: p.id.toString(),
                name: p.name,
                description: p.description,
                technologies: p.technologies || '',
              }))
            );
          }

          // References
          if (cvData.references) {
            setReferences(
              cvData.references.map((r: any) => ({
                id: r.id.toString(),
                name: r.name,
                position: r.position,
                workplace: r.workplace,
                phone: r.phone,
                email: r.email,
              }))
            );
          }

          // Certifications
          if (cvData.certifications) {
            setCertifications(
              cvData.certifications.map((c: any) => ({
                id: c.id.toString(),
                name: c.name,
                issuer: c.issuer,
                date: c.year,
              }))
            );
          }

          // Languages
          if (cvData.languages) {
            setLanguages(
              cvData.languages.map((l: any) => ({
                id: l.id.toString(),
                language: l.name,
                proficiency: l.proficiency,
              }))
            );
          }

          // Awards
          if (cvData.awards) {
            setAwards(
              cvData.awards.map((a: any) => ({
                id: a.id.toString(),
                title: a.title,
                issuer: a.issuer,
                date: a.year,
                description: a.description || '',
              }))
            );
          }
        } else {
          // No CV yet – use profile defaults
          setFullName(`${u.first_name || ''} ${u.last_name || ''}`.trim());
          setEmail(u.email || '');
          setPhone(u.phone || '');
          if (u.profile_picture) {
            setProfilePhoto(u.profile_picture);
          }
        }
      } catch (err) {
        console.error('Failed to load CV data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- SAVE HANDLER ---
  const handleSave = async () => {
    try {
      setSaving(true);

      // 1. Save base CV
      const basePayload = {
        id: cvId,
        full_name: fullName,
        title: headline,
        summary: summary,
        email: email,
        phone: phone,
        location: location,
        linkedin: linkedin,
        portfolio_website: website,
      };

      const savedCV = await cvService.saveCV(basePayload);
      if (!cvId) setCvId(savedCV.id);

      // 2. Save new list items (those with temp- IDs)
      for (const item of education) {
        if (item.id.includes('temp-')) {
          await cvService.addEducation({
            degree: item.degree,
            institution: item.institution,
            start_date: item.startDate,
            end_date: item.endDate,
            description: item.description,
          });
        }
      }

      for (const item of experiences) {
        if (item.id.includes('temp-')) {
          await cvService.addExperience({
            position: item.position,
            company: item.company,
            location: item.location,
            start_date: item.startDate,
            end_date: item.endDate,
            description: item.description,
          });
        }
      }

      for (const item of projects) {
        if (item.id.includes('temp-')) {
          await cvService.addProject({
            name: item.name,
            description: item.description,
            technologies: item.technologies,
          });
        }
      }

      for (const item of references) {
        if (item.id.includes('temp-')) {
          await cvService.addReference({
            name: item.name,
            position: item.position,
            workplace: item.workplace,
            phone: item.phone,
            email: item.email,
          });
        }
      }

      for (const item of certifications) {
        if (item.id.includes('temp-')) {
          await cvService.addCertification({
            name: item.name,
            issuer: item.issuer,
            year: item.date,
          });
        }
      }

      // Languages
      if (cvService.addLanguage) {
        for (const item of languages) {
          if (item.id.includes('temp-')) {
            try {
              await cvService.addLanguage({
                name: item.language,
                proficiency: item.proficiency,
              });
            } catch {
              // ignore duplicates or errors
            }
          }
        }
      }

      // Awards
      if (cvService.addAward) {
        for (const item of awards) {
          if (item.id.includes('temp-')) {
            try {
              await cvService.addAward({
                title: item.title,
                issuer: item.issuer,
                year: item.date,
                description: item.description,
              });
            } catch {
              // ignore duplicates or errors
            }
          }
        }
      }

      // Skills – backend handles duplicates
      for (const skill of skills) {
        try {
          await cvService.addSkill({ name: skill });
        } catch {
          // ignore if already exists
        }
      }

      alert('Saved successfully!');
    } catch (err) {
      console.error('Save failed', err);
      alert('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // Photo upload handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImageUrl(reader.result as string);
        setIsCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedImageUrl: string) => {
    // Update UI immediately
    setProfilePhoto(croppedImageUrl);
    setTempImageUrl(null);
    setIsCropDialogOpen(false);

    try {
      // Ensure we have a CV id
      let id = cvId;

      if (!id) {
        // Try to fetch existing CV
        const existing = await cvService.getMyCV();
        if (existing?.id) {
          id = existing.id;
          setCvId(existing.id);
        } else {
          // As a fallback, create a minimal CV so the image has somewhere to go
          const created = await cvService.saveCV({
            full_name: fullName || '',
            title: headline || '',
            summary,
            email,
            phone,
            location,
            linkedin,
            portfolio_website: website,
          });
          id = created.id;
          setCvId(created.id);
        }
      }

      if (!id) {
        console.error('No CV id available to upload profile image');
        return;
      }

      // Convert data URL into a File object
      const res = await fetch(croppedImageUrl);
      const blob = await res.blob();
      const file = new File([blob], 'profile.jpg', {
        type: blob.type || 'image/jpeg',
      });

      // Upload directly to CV.profile_image via cvService
      await cvService.uploadProfileImage(id, file);
    } catch (e) {
      console.error('CV profile photo upload failed', e);
      alert('Failed to upload CV photo.');
    }
  };

  // If preview is active, show preview page
  if (showPreview) {
    const formData = {
      personal: {
        fullName,
        title: headline,
        summary,
      },
      contact: {
        email,
        phone,
        location,
        linkedin,
        website,
      },
      education: education.map((edu) => ({
        id: edu.id,
        degree: edu.degree,
        institution: edu.institution,
        startDate: edu.startDate,
        endDate: edu.endDate,
        description: edu.description,
      })),
      experience: experiences.map((exp) => ({
        id: exp.id,
        position: exp.position,
        company: exp.company,
        startDate: exp.startDate,
        endDate: exp.endDate,
        description: exp.description,
      })),
      skills: skills.map((skill, index) => ({
        id: index.toString(),
        name: skill,
      })),
      certifications: certifications.map((cert) => ({
        id: cert.id,
        name: cert.name,
        issuer: cert.issuer,
        year: cert.date,
      })),
      languages: languages.map((lang) => ({
        id: lang.id,
        name: lang.language,
        proficiency: lang.proficiency,
      })),
      awards: awards.map((award) => ({
        id: award.id,
        title: award.title,
        issuer: award.issuer,
        year: award.date,
        description: award.description,
      })),
      projects: projects.map((proj) => ({
        id: proj.id,
        name: proj.name,
        description: proj.description,
        url: '',
      })),
      references: references.map((ref) => ({
        id: ref.id,
        name: ref.name,
        position: ref.position,
        workplace: ref.workplace,
        phone: ref.phone,
        email: ref.email,
      })),
    };

    return <CVPreviewPage formData={formData} onBack={() => setShowPreview(false)} />;
  }

  const steps = [
    { id: 'personal' as Step, label: 'Personal Details', icon: User },
    { id: 'contact' as Step, label: 'Contact Info', icon: Mail },
    { id: 'education' as Step, label: 'Education', icon: GraduationCap },
    { id: 'experience' as Step, label: 'Experience', icon: Briefcase },
    { id: 'skills' as Step, label: 'Skills', icon: Code },
    { id: 'certifications' as Step, label: 'Certifications', icon: Award },
    { id: 'languages' as Step, label: 'Languages', icon: Globe },
    { id: 'awards' as Step, label: 'Awards', icon: Trophy },
    { id: 'projects' as Step, label: 'Projects', icon: FolderOpen },
    { id: 'references' as Step, label: 'References', icon: Users },
    { id: 'photo' as Step, label: 'Upload Photo', icon: Upload },
    { id: 'generate' as Step, label: 'Generate CV', icon: Download },
  ];

  // Education functions
  const addEducation = () => {
    const newEdu: Education = {
      id: `temp-${Date.now()}`,
      degree: '',
      institution: '',
      startDate: '',
      endDate: '',
      description: '',
    };
    setEducation([...education, newEdu]);
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setEducation(education.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu)));
  };

  const deleteEducation = async (id: string) => {
    if (!id.includes('temp-')) {
      try {
        await cvService.deleteEducation(Number(id));
      } catch (e) {
        console.error('Failed to delete education', e);
      }
    }
    setEducation(education.filter((edu) => edu.id !== id));
  };

  // Experience functions
  const addExperience = () => {
    const newExp: Experience = {
      id: `temp-${Date.now()}`,
      position: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
    };
    setExperiences([...experiences, newExp]);
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    setExperiences(experiences.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp)));
  };

  const deleteExperience = async (id: string) => {
    if (!id.includes('temp-')) {
      try {
        await cvService.deleteExperience(Number(id));
      } catch (e) {
        console.error('Failed to delete experience', e);
      }
    }
    setExperiences(experiences.filter((exp) => exp.id !== id));
  };

  // Skills functions
  const addSkill = () => {
    if (skillInput.trim()) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  // Certification functions
  const addCertification = () => {
    const newCert: Certification = {
      id: `temp-${Date.now()}`,
      name: '',
      issuer: '',
      date: '',
    };
    setCertifications([...certifications, newCert]);
  };

  const updateCertification = (id: string, field: keyof Certification, value: string) => {
    setCertifications(
      certifications.map((cert) => (cert.id === id ? { ...cert, [field]: value } : cert))
    );
  };

  const deleteCertification = async (id: string) => {
    if (!id.includes('temp-')) {
      try {
        await cvService.deleteCertification(Number(id));
      } catch (e) {
        console.error('Failed to delete certification', e);
      }
    }
    setCertifications(certifications.filter((cert) => cert.id !== id));
  };

  // Language functions
  const addLanguage = () => {
    const newLang: Language = {
      id: `temp-${Date.now()}`,
      language: '',
      proficiency: '',
    };
    setLanguages([...languages, newLang]);
  };

  const updateLanguage = (id: string, field: keyof Language, value: string) => {
    setLanguages(languages.map((lang) => (lang.id === id ? { ...lang, [field]: value } : lang)));
  };

  const deleteLanguage = (id: string) => {
    setLanguages(languages.filter((lang) => lang.id !== id));
  };

  // Award functions
  const addAward = () => {
    const newAward: AwardType = {
      id: `temp-${Date.now()}`,
      title: '',
      issuer: '',
      date: '',
      description: '',
    };
    setAwards([...awards, newAward]);
  };

  const updateAward = (id: string, field: keyof AwardType, value: string) => {
    setAwards(awards.map((award) => (award.id === id ? { ...award, [field]: value } : award)));
  };

  const deleteAward = (id: string) => {
    setAwards(awards.filter((award) => award.id !== id));
  };

  // Project functions
  const addProject = () => {
    const newProject: Project = {
      id: `temp-${Date.now()}`,
      name: '',
      description: '',
      technologies: '',
    };
    setProjects([...projects, newProject]);
  };

  const updateProject = (id: string, field: keyof Project, value: string) => {
    setProjects(projects.map((proj) => (proj.id === id ? { ...proj, [field]: value } : proj)));
  };

  const deleteProject = async (id: string) => {
    if (!id.includes('temp-')) {
      try {
        await cvService.deleteProject(Number(id));
      } catch (e) {
        console.error('Failed to delete project', e);
      }
    }
    setProjects(projects.filter((proj) => proj.id !== id));
  };

  // Reference functions
  const addReference = () => {
    const newReference: Reference = {
      id: `temp-${Date.now()}`,
      name: '',
      position: '',
      workplace: '',
      phone: '',
      email: '',
    };
    setReferences([...references, newReference]);
  };

  const updateReference = (id: string, field: keyof Reference, value: string) => {
    setReferences(references.map((ref) => (ref.id === id ? { ...ref, [field]: value } : ref)));
  };

  const deleteReference = async (id: string) => {
    if (!id.includes('temp-')) {
      try {
        await cvService.deleteReference(Number(id));
      } catch (e) {
        console.error('Failed to delete reference', e);
      }
    }
    setReferences(references.filter((ref) => ref.id !== id));
  };

  // --- LOADING SCREEN ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${theme === 'light' ? 'bg-[#EBF2FA]' : 'bg-gray-950'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>CV Generator</h1>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
            Create your professional CV step by step
          </p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          {currentStep !== 'generate' && (
            <div className="w-64 flex-shrink-0">
              <Card
                className={`rounded-2xl shadow-sm p-6 ${
                  theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'
                }`}
              >
                <nav className="space-y-2">
                  {steps
                    .filter((step) => step.id !== 'generate')
                    .map((step) => {
                      const Icon = step.icon;
                      const isActive = currentStep === step.id;
                      return (
                        <button
                          key={step.id}
                          onClick={() => setCurrentStep(step.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            isActive
                              ? theme === 'light'
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-blue-500/20 text-blue-400'
                              : theme === 'light'
                              ? 'text-gray-700 hover:bg-gray-50'
                              : 'text-gray-400 hover:bg-gray-800'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-sm">{step.label}</span>
                        </button>
                      );
                    })}
                </nav>
              </Card>
            </div>
          )}

          {/* Main Content */}
          <div className={currentStep === 'generate' ? 'w-full max-w-4xl mx-auto' : 'flex-1'}>
            <Card
              className={`rounded-2xl shadow-sm p-8 min-h-[600px] ${
                theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'
              }`}
            >
              {/* Personal Details */}
              {currentStep === 'personal' && (
                <div className="space-y-6">
                  <div>
                    <h2 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      Personal Details
                    </h2>
                    <p
                      className={`text-sm ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}
                    >
                      Enter your basic information
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                        Full Name
                      </Label>
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className={
                          theme === 'light'
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-gray-950 border-gray-700 text-white'
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                        Professional Headline
                      </Label>
                      <Input
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        placeholder="e.g., Media & Communication Student"
                        className={
                          theme === 'light'
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-gray-950 border-gray-700 text-white'
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                        Professional Summary
                      </Label>
                      <Textarea
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        placeholder="Write a brief professional summary..."
                        className={`min-h-[120px] ${
                          theme === 'light'
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-gray-950 border-gray-700 text-white'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Info */}
              {currentStep === 'contact' && (
                <div className="space-y-6">
                  <div>
                    <h2 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      Contact Information
                    </h2>
                    <p
                      className={`text-sm ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}
                    >
                      How can employers reach you?
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                        Email
                      </Label>
                      <div className="relative">
                        <Mail
                          className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                            theme === 'light' ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        />
                        <Input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.email@aiu.edu.my"
                          className={`pl-10 ${
                            theme === 'light'
                              ? 'bg-gray-50 border-gray-200'
                              : 'bg-gray-950 border-gray-700 text-white'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                        Phone
                      </Label>
                      <div className="relative">
                        <Phone
                          className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                            theme === 'light' ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        />
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+60 12-345 6789"
                          className={`pl-10 ${
                            theme === 'light'
                              ? 'bg-gray-50 border-gray-200'
                              : 'bg-gray-950 border-gray-700 text-white'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                        Location
                      </Label>
                      <div className="relative">
                        <MapPin
                          className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                            theme === 'light' ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        />
                        <Input
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="City, Country"
                          className={`pl-10 ${
                            theme === 'light'
                              ? 'bg-gray-50 border-gray-200'
                              : 'bg-gray-950 border-gray-700 text-white'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                        LinkedIn Profile (Optional)
                      </Label>
                      <Input
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="linkedin.com/in/yourprofile"
                        className={
                          theme === 'light'
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-gray-950 border-gray-700 text-white'
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                        Website/Portfolio (Optional)
                      </Label>
                      <Input
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className={
                          theme === 'light'
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-gray-950 border-gray-700 text-white'
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Education */}
              {currentStep === 'education' && (
                <div className="space-y-6">
                  <div>
                    <h2 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      Education
                    </h2>
                    <p
                      className={`text-sm ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}
                    >
                      Add your educational background
                    </p>
                  </div>

                  <div className="space-y-4">
                    {education.map((edu) => (
                      <div
                        key={edu.id}
                        className={`p-6 rounded-xl border-2 relative ${
                          theme === 'light'
                            ? 'border-gray-200 bg-white'
                            : 'border-gray-700 bg-gray-800/30'
                        }`}
                      >
                        <button
                          onClick={() => deleteEducation(edu.id)}
                          className={`absolute top-4 right-4 ${
                            theme === 'light'
                              ? 'text-gray-400 hover:text-red-500'
                              : 'text-gray-400 hover:text-red-400'
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="space-y-4 pr-8">
                          <div className="space-y-2">
                            <Label
                              className={`text-xs ${
                                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                              }`}
                            >
                              Degree/Program
                            </Label>
                            <Input
                              value={edu.degree}
                              onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                              placeholder="e.g., Bachelor of Media & Communication"
                              className={
                                theme === 'light'
                                  ? 'bg-white border-gray-200'
                                  : 'bg-gray-950 border-gray-700 text-white'
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label
                              className={`text-xs ${
                                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                              }`}
                            >
                              Institution
                            </Label>
                            <Input
                              value={edu.institution}
                              onChange={(e) =>
                                updateEducation(edu.id, 'institution', e.target.value)
                              }
                              placeholder="University name"
                              className={
                                theme === 'light'
                                  ? 'bg-white border-gray-200'
                                  : 'bg-gray-950 border-gray-700 text-white'
                              }
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label
                                className={`text-xs ${
                                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                                }`}
                              >
                                Start Date
                              </Label>
                              <Input
                                type="month"
                                value={edu.startDate}
                                onChange={(e) =>
                                  updateEducation(edu.id, 'startDate', e.target.value)
                                }
                                className={
                                  theme === 'light'
                                    ? 'bg-white border-gray-200'
                                    : 'bg-gray-950 border-gray-700 text-white'
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                className={`text-xs ${
                                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                                }`}
                              >
                                End Date
                              </Label>
                              <Input
                                type="month"
                                value={edu.endDate}
                                onChange={(e) =>
                                  updateEducation(edu.id, 'endDate', e.target.value)
                                }
                                className={
                                  theme === 'light'
                                    ? 'bg-white border-gray-200'
                                    : 'bg-gray-950 border-gray-700 text-white'
                                }
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label
                              className={`text-xs ${
                                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                              }`}
                            >
                              Description (Optional)
                            </Label>
                            <Textarea
                              value={edu.description}
                              onChange={(e) =>
                                updateEducation(edu.id, 'description', e.target.value)
                              }
                              placeholder="Relevant coursework, achievements, GPA..."
                              className={`min-h-[80px] ${
                                theme === 'light'
                                  ? 'bg-white border-gray-200'
                                  : 'bg-gray-950 border-gray-700 text-white'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      onClick={addEducation}
                      variant="outline"
                      className={`w-full border-dashed border-2 ${
                        theme === 'light'
                          ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                          : 'border-gray-700 hover:border-blue-500 hover:bg-blue-500/10'
                      }`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Education
                    </Button>
                  </div>
                </div>
              )}

              {/* Experience */}
              {currentStep === 'experience' && (
                <div className="space-y-6">
                  <div>
                    <h2 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      Work Experience
                    </h2>
                    <p
                      className={`text-sm ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}
                    >
                      Add your professional experience and internships
                    </p>
                  </div>

                  <div className="space-y-4">
                    {experiences.map((exp) => (
                      <div
                        key={exp.id}
                        className={`p-6 rounded-xl border-2 relative ${
                          theme === 'light'
                            ? 'border-gray-200 bg-white'
                            : 'border-gray-700 bg-gray-800/30'
                        }`}
                      >
                        <button
                          onClick={() => deleteExperience(exp.id)}
                          className={`absolute top-4 right-4 ${
                            theme === 'light'
                              ? 'text-gray-400 hover:text-red-500'
                              : 'text-gray-400 hover:text-red-400'
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="space-y-4 pr-8">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label
                                className={`text-xs ${
                                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                                }`}
                              >
                                Position
                              </Label>
                              <Input
                                value={exp.position}
                                onChange={(e) =>
                                  updateExperience(exp.id, 'position', e.target.value)
                                }
                                placeholder="e.g., Video Editor"
                                className={
                                  theme === 'light'
                                    ? 'bg-white border-gray-200'
                                    : 'bg-gray-950 border-gray-700 text-white'
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                className={`text-xs ${
                                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                                }`}
                              >
                                Company
                              </Label>
                              <Input
                                value={exp.company}
                                onChange={(e) =>
                                  updateExperience(exp.id, 'company', e.target.value)
                                }
                                placeholder="Company name"
                                className={
                                  theme === 'light'
                                    ? 'bg-white border-gray-200'
                                    : 'bg-gray-950 border-gray-700 text-white'
                                }
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label
                              className={`text-xs ${
                                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                              }`}
                            >
                              Location
                            </Label>
                            <Input
                              value={exp.location}
                              onChange={(e) =>
                                updateExperience(exp.id, 'location', e.target.value)
                              }
                              placeholder="City, Country"
                              className={
                                theme === 'light'
                                  ? 'bg-white border-gray-200'
                                  : 'bg-gray-950 border-gray-700 text-white'
                              }
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label
                                className={`text-xs ${
                                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                                }`}
                              >
                                Start Date
                              </Label>
                              <Input
                                type="month"
                                value={exp.startDate}
                                onChange={(e) =>
                                  updateExperience(exp.id, 'startDate', e.target.value)
                                }
                                className={
                                  theme === 'light'
                                    ? 'bg-white border-gray-200'
                                    : 'bg-gray-950 border-gray-700 text-white'
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                className={`text-xs ${
                                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                                }`}
                              >
                                End Date
                              </Label>
                              <Input
                                type="month"
                                value={exp.endDate}
                                onChange={(e) =>
                                  updateExperience(exp.id, 'endDate', e.target.value)
                                }
                                className={
                                  theme === 'light'
                                    ? 'bg-white border-gray-200'
                                    : 'bg-gray-950 border-gray-700 text-white'
                                }
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label
                              className={`text-xs ${
                                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                              }`}
                            >
                              Description
                            </Label>
                            <Textarea
                              value={exp.description}
                              onChange={(e) =>
                                updateExperience(exp.id, 'description', e.target.value)
                              }
                              placeholder="Describe your responsibilities and achievements..."
                              className={`min-h-[80px] ${
                                theme === 'light'
                                  ? 'bg-white border-gray-200'
                                  : 'bg-gray-950 border-gray-700 text-white'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      onClick={addExperience}
                      variant="outline"
                      className={`w-full border-dashed border-2 ${
                        theme === 'light'
                          ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                          : 'border-gray-700 hover:border-blue-500 hover:bg-blue-500/10'
                      }`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Experience
                    </Button>
                  </div>
                </div>
              )}

              {/* Skills */}
              {currentStep === 'skills' && (
                <div className="space-y-6">
                  <div>
                    <h2 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      Skills
                    </h2>
                    <p
                      className={`text-sm ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}
                    >
                      Add your technical and soft skills. Press Enter to add each skill.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                        Add Skills
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={handleSkillKeyDown}
                          placeholder="Type a skill and press Enter"
                          className={
                            theme === 'light'
                              ? 'bg-gray-50 border-gray-200'
                              : 'bg-gray-950 border-gray-700 text-white'
                          }
                        />
                        <Button
                          onClick={addSkill}
                          className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                    {skills.length > 0 && (
                      <div className="space-y-3">
                        <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                          Your Skills
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {skills.map((skill, index) => (
                            <Badge
                              key={index}
                              className={`px-4 py-2 rounded-full flex items-center gap-2 ${
                                theme === 'light'
                                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}
                            >
                              <span>{skill}</span>
                              <button
                                onClick={() => removeSkill(index)}
                                className={
                                  theme === 'light'
                                    ? 'hover:bg-blue-200 rounded-full p-0.5'
                                    : 'hover:bg-blue-500/30 rounded-full p-0.5'
                                }
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {skills.length === 0 && (
                      <div
                        className={`text-center py-12 ${
                          theme === 'light' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        <Code className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No skills added yet. Start adding your skills above.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {currentStep === 'certifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      Certifications
                    </h2>
                    <p
                      className={`text-sm ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}
                    >
                      Add professional certifications and training
                    </p>
                  </div>

                  <div className="space-y-4">
                    {certifications.map((cert) => (
                      <div
                        key={cert.id}
                        className={`p-6 rounded-xl border-2 relative ${
                          theme === 'light'
                            ? 'border-gray-200 bg-white'
                            : 'border-gray-700 bg-gray-800/30'
                        }`}
                      >
                        <button
                          onClick={() => deleteCertification(cert.id)}
                          className={`absolute top-4 right-4 ${
                            theme === 'light'
                              ? 'text-gray-400 hover:text-red-500'
                              : 'text-gray-400 hover:text-red-400'
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="space-y-4 pr-8">
                          <div className="space-y-2">
                            <Label
                              className={`text-xs ${
                                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                              }`}
                            >
                              Certification Name
                            </Label>
                            <Input
                              value={cert.name}
                              onChange={(e) =>
                                updateCertification(cert.id, 'name', e.target.value)
                              }
                              placeholder="e.g., Adobe Certified Professional"
                              className={
                                theme === 'light'
                                  ? 'bg-white border-gray-200'
                                  : 'bg-gray-950 border-gray-700 text-white'
                              }
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label
                                className={`text-xs ${
                                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                                }`}
                              >
                                Issuing Organization
                              </Label>
                              <Input
                                value={cert.issuer}
                                onChange={(e) =>
                                  updateCertification(cert.id, 'issuer', e.target.value)
                                }
                                placeholder="Organization name"
                                className={
                                  theme === 'light'
                                    ? 'bg-white border-gray-200'
                                    : 'bg-gray-950 border-gray-700 text-white'
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                className={`text-xs ${
                                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                                }`}
                              >
                                Date Obtained
                              </Label>
                              <Input
                                type="month"
                                value={cert.date}
                                onChange={(e) =>
                                  updateCertification(cert.id, 'date', e.target.value)
                                }
                                className={
                                  theme === 'light'
                                    ? 'bg-white border-gray-200'
                                    : 'bg-gray-950 border-gray-700 text-white'
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      onClick={addCertification}
                      variant="outline"
                      className={`w-full border-dashed border-2 ${
                        theme === 'light'
                          ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                          : 'border-gray-700 hover:border-blue-500 hover:bg-blue-500/10'
                      }`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Certification
                    </Button>
                  </div>
                </div>
              )}

              {/* Languages */}
              {currentStep === 'languages' && (
                <div className="space-y-6">
                  <div>
                    <h2 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      Languages
                    </h2>
                    <p
                      className={`text-sm ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}
                    >
                      Add languages you speak and your proficiency level
                    </p>
                  </div>

                  <div className="space-y-4">
                    {languages.map((lang) => (
                      <div
                        key={lang.id}
                        className={`p-6 rounded-xl border-2 relative ${
                          theme === 'light'
                            ? 'border-gray-200 bg-white'
                            : 'border-gray-700 bg-gray-800/30'
                        }`}
                      >
                        <button
                          onClick={() => deleteLanguage(lang.id)}
                          className={`absolute top-4 right-4 ${
                            theme === 'light'
                              ? 'text-gray-400 hover:text-red-500'
                              : 'text-gray-400 hover:text-red-400'
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="space-y-4 pr-8">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label
                                className={`text-xs ${
                                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                                }`}
                              >
                                Language
                              </Label>
                              <Input
                                value={lang.language}
                                onChange={(e) =>
                                  updateLanguage(lang.id, 'language', e.target.value)
                                }
                                placeholder="e.g., English"
                                className={
                                  theme === 'light'
                                    ? 'bg-white border-gray-200'
                                    : 'bg-gray-950 border-gray-700 text-white'
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                className={`text-xs ${
                                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                                }`}
                              >
                                Proficiency
                              </Label>
                              <Select
                                value={lang.proficiency}
                                onValueChange={(value) =>
                                  updateLanguage(lang.id, 'proficiency', value)
                                }
                              >
                                <SelectTrigger
                                  className={
                                    theme === 'light'
                                      ? 'bg-white border-gray-200'
                                      : 'bg-gray-950 border-gray-700 text-white'
                                  }
                                >
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent
                                  className={
                                    theme === 'light'
                                      ? 'bg-white border-gray-200'
                                      : 'bg-gray-900 border-gray-800 text-white'
                                  }
                                >
                                  {proficiencyLevels.map((level) => (
                                    <SelectItem key={level} value={level}>
                                      {level}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      onClick={addLanguage}
                      variant="outline"
                      className={`w-full border-dashed border-2 ${
                        theme === 'light'
                          ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                          : 'border-gray-700 hover:border-blue-500 hover:bg-blue-500/10'
                      }`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Language
                    </Button>
                  </div>
                </div>
              )}

              {/* Awards */}
              {currentStep === 'awards' && (
                <div className="space-y-6">
                  <div>
                    <h2 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      Awards & Honors
                    </h2>
                    <p
                      className={`text-sm ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}
                    >
                      Add any awards, honors, or recognitions you've received
                    </p>
                  </div>

                  <div className="space-y-4">
                    {awards.map((award) => (
                      <div
                        key={award.id}
                        className={`p-6 rounded-xl border-2 relative ${
                          theme === 'light'
                            ? 'border-gray-200 bg-white'
                            : 'border-gray-700 bg-gray-800/30'
                        }`}
                      >
                        <button
                          onClick={() => deleteAward(award.id)}
                          className={`absolute top-4 right-4 ${
                            theme === 'light'
                              ? 'text-gray-400 hover:text-red-500'
                              : 'text-gray-400 hover:text-red-400'
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="space-y-4 pr-8">
                          <div className="space-y-2">
                            <Label
                              className={`text-xs ${
                                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                              }`}
                            >
                              Award Title
                            </Label>
                            <Input
                              value={award.title}
                              onChange={(e) =>
                                updateAward(award.id, 'title', e.target.value)
                              }
                              placeholder="e.g., Best Student Film Award"
                              className={
                                theme === 'light'
                                  ? 'bg-white border-gray-200'
                                  : 'bg-gray-950 border-gray-700 text-white'
                              }
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label
                                className={`text-xs ${
                                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                                }`}
                              >
                                Issuing Organization
                              </Label>
                              <Input
                                value={award.issuer}
                                onChange={(e) =>
                                  updateAward(award.id, 'issuer', e.target.value)
                                }
                                placeholder="Organization name"
                                className={
                                  theme === 'light'
                                    ? 'bg-white border-gray-200'
                                    : 'bg-gray-950 border-gray-700 text-white'
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                className={`text-xs ${
                                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                                }`}
                              >
                                Date Received
                              </Label>
                              <Input
                                type="month"
                                value={award.date}
                                onChange={(e) =>
                                  updateAward(award.id, 'date', e.target.value)
                                }
                                className={
                                  theme === 'light'
                                    ? 'bg-white border-gray-200'
                                    : 'bg-gray-950 border-gray-700 text-white'
                                }
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label
                              className={`text-xs ${
                                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                              }`}
                            >
                              Description (Optional)
                            </Label>
                            <Textarea
                              value={award.description}
                              onChange={(e) =>
                                updateAward(award.id, 'description', e.target.value)
                              }
                              placeholder="Brief description of the award..."
                              className={`min-h-[60px] ${
                                theme === 'light'
                                  ? 'bg-white border-gray-200'
                                  : 'bg-gray-950 border-gray-700 text-white'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      onClick={addAward}
                      variant="outline"
                      className={`w-full border-dashed border-2 ${
                        theme === 'light'
                          ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                          : 'border-gray-700 hover:border-blue-500 hover:bg-blue-500/10'
                      }`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Award
                    </Button>
                  </div>
                </div>
              )}

              {/* Projects */}
              {currentStep === 'projects' && (
                <div className="space-y-6">
                  <div>
                    <h2 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      Projects (Optional)
                    </h2>
                    <p
                      className={`text-sm ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}
                    >
                      Showcase your significant projects
                    </p>
                  </div>

                  <div className="space-y-4">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className={`p-6 rounded-xl border-2 relative ${
                          theme === 'light'
                            ? 'border-gray-200 bg-white'
                            : 'border-gray-700 bg-gray-800/30'
                        }`}
                      >
                        <button
                          onClick={() => deleteProject(project.id)}
                          className={`absolute top-4 right-4 ${
                            theme === 'light'
                              ? 'text-gray-400 hover:text-red-500'
                              : 'text-gray-400 hover:text-red-400'
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="space-y-4 pr-8">
                          <div className="space-y-2">
                            <Label
                              className={`text-xs ${
                                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                              }`}
                            >
                              Project Name
                            </Label>
                            <Input
                              value={project.name}
                              onChange={(e) =>
                                updateProject(project.id, 'name', e.target.value)
                              }
                              placeholder="e.g., Documentary Film Production"
                              className={
                                theme === 'light'
                                  ? 'bg-white border-gray-200'
                                  : 'bg-gray-950 border-gray-700 text-white'
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label
                              className={`text-xs ${
                                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                              }`}
                            >
                              Description
                            </Label>
                            <Textarea
                              value={project.description}
                              onChange={(e) =>
                                updateProject(project.id, 'description', e.target.value)
                              }
                              placeholder="Describe the project and your role..."
                              className={`min-h-[80px] ${
                                theme === 'light'
                                  ? 'bg-white border-gray-200'
                                  : 'bg-gray-950 border-gray-700 text-white'
                              }`}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label
                              className={`text-xs ${
                                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                              }`}
                            >
                              Technologies/Tools Used
                            </Label>
                            <Input
                              value={project.technologies}
                              onChange={(e) =>
                                updateProject(project.id, 'technologies', e.target.value)
                              }
                              placeholder="e.g., Adobe Premiere Pro, DaVinci Resolve"
                              className={
                                theme === 'light'
                                  ? 'bg-white border-gray-200'
                                  : 'bg-gray-950 border-gray-700 text-white'
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      onClick={addProject}
                      variant="outline"
                      className={`w-full border-dashed border-2 ${
                        theme === 'light'
                          ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                          : 'border-gray-700 hover:border-blue-500 hover:bg-blue-500/10'
                      }`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Project
                    </Button>
                  </div>
                </div>
              )}

              {/* References */}
              {currentStep === 'references' && (
                <div className="space-y-6">
                  <div>
                    <h2 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      References (Optional)
                    </h2>
                    <p
                      className={`text-sm ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}
                    >
                      Add professional references who can speak about your work
                    </p>
                  </div>

                  <div className="space-y-4">
                    {references.map((reference) => (
                      <div
                        key={reference.id}
                        className={`p-6 rounded-xl border-2 relative ${
                          theme === 'light'
                            ? 'border-gray-200 bg-white'
                            : 'border-gray-700 bg-gray-800/30'
                        }`}
                      >
                        <button
                          onClick={() => deleteReference(reference.id)}
                          className={`absolute top-4 right-4 ${
                            theme === 'light'
                              ? 'text-gray-400 hover:text-red-500'
                              : 'text-gray-400 hover:text-red-400'
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="space-y-4 pr-8">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label
                                className={`text-xs ${
                                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                                }`}
                              >
                                Name
                              </Label>
                              <Input
                                value={reference.name}
                                onChange={(e) =>
                                  updateReference(reference.id, 'name', e.target.value)
                                }
                                placeholder="e.g., Dr. Ahmad Hassan"
                                className={
                                  theme === 'light'
                                    ? 'bg-white border-gray-200'
                                    : 'bg-gray-950 border-gray-700 text-white'
                              }
                              />
                            </div>

                            <div className="space-y-2">
                              <Label
                                className={`text-xs ${
                                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                                }`}
                              >
                                Position
                              </Label>
                              <Input
                                value={reference.position}
                                onChange={(e) =>
                                  updateReference(reference.id, 'position', e.target.value)
                                }
                                placeholder="e.g., Senior Lecturer"
                                className={
                                  theme === 'light'
                                    ? 'bg-white border-gray-200'
                                    : 'bg-gray-950 border-gray-700 text-white'
                              }
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label
                              className={`text-xs ${
                                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                              }`}
                            >
                              Workplace
                            </Label>
                            <Input
                              value={reference.workplace}
                              onChange={(e) =>
                                updateReference(reference.id, 'workplace', e.target.value)
                              }
                              placeholder="e.g., Albukhary International University"
                              className={
                                theme === 'light'
                                  ? 'bg-white border-gray-200'
                                  : 'bg-gray-950 border-gray-700 text-white'
                              }
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label
                                className={`text-xs ${
                                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                                }`}
                              >
                                Phone Number (Optional)
                              </Label>
                              <Input
                                value={reference.phone}
                                onChange={(e) =>
                                  updateReference(reference.id, 'phone', e.target.value)
                                }
                                placeholder="e.g., +60 12-987 6543"
                                className={
                                  theme === 'light'
                                    ? 'bg-white border-gray-200'
                                    : 'bg-gray-950 border-gray-700 text-white'
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <Label
                                className={`text-xs ${
                                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                                }`}
                              >
                                Email
                              </Label>
                              <Input
                                value={reference.email}
                                onChange={(e) =>
                                  updateReference(reference.id, 'email', e.target.value)
                                }
                                placeholder="e.g., ahmad@aiu.edu.my"
                                className={
                                  theme === 'light'
                                    ? 'bg-white border-gray-200'
                                    : 'bg-gray-950 border-gray-700 text-white'
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      onClick={addReference}
                      variant="outline"
                      className={`w-full border-dashed border-2 ${
                        theme === 'light'
                          ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                          : 'border-gray-700 hover:border-blue-500 hover:bg-blue-500/10'
                      }`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Reference
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload Photo */}
              {currentStep === 'photo' && (
                <div className="space-y-6">
                  <div>
                    <h2 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      Upload Profile Photo
                    </h2>
                    <p
                      className={`text-sm ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}
                    >
                      Add a professional photo for your CV (optional)
                    </p>
                  </div>

                  <div
                    className={`border-2 border-dashed rounded-xl p-12 text-center ${
                      theme === 'light'
                        ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50/30'
                        : 'border-gray-700 hover:border-blue-500 hover:bg-blue-500/5'
                    } transition-colors cursor-pointer`}
                  >
                    <div className="max-w-sm mx-auto">
                      {profilePhoto ? (
                        <div className="space-y-4">
                          <div className="w-32 h-32 mx-auto rounded-full overflow-hidden">
                            <ImageWithFallback
                              src={profilePhoto}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="outline"
                              className={
                                theme === 'light' ? 'border-gray-300' : 'border-gray-700'
                              }
                              onClick={() =>
                                document.getElementById('cv-photo-upload')?.click()
                              }
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Change Photo
                            </Button>
                            <Button
                              variant="outline"
                              className={
                                theme === 'light' ? 'border-gray-300' : 'border-gray-700'
                              }
                              onClick={() => setProfilePhoto('')}
                            >
                              Remove Photo
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload
                            className={`h-16 w-16 mx-auto mb-4 ${
                              theme === 'light' ? 'text-gray-400' : 'text-gray-500'
                            }`}
                          />
                          <h3
                            className={
                              theme === 'light' ? 'text-gray-900 mb-2' : 'text-white mb-2'
                            }
                          >
                            Upload Profile Photo
                          </h3>
                          <p
                            className={`text-sm mb-4 ${
                              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                            }`}
                          >
                            Click to upload or drag and drop your photo here
                          </p>
                          <p
                            className={`text-xs ${
                              theme === 'light' ? 'text-gray-400' : 'text-gray-500'
                            }`}
                          >
                            JPG, PNG or JPEG, maximum file size 2MB
                          </p>
                          <Button
                            className="mt-6 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                            onClick={() =>
                              document.getElementById('cv-photo-upload')?.click()
                            }
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Choose File
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <input
                    id="cv-photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              )}

              {/* Generate CV */}
              {currentStep === 'generate' && (
                <div className="space-y-6">
                  <div>
                    <h2 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      Your CV is Ready!
                    </h2>
                    <p
                      className={`text-sm ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}
                    >
                      Preview your CV or download it as a PDF
                    </p>
                  </div>

                  <div
                    className={`border-2 rounded-xl p-8 ${
                      theme === 'light'
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-gray-700 bg-gray-800/30'
                    }`}
                  >
                    <FileText
                      className={`h-20 w-20 mx-auto mb-6 ${
                        theme === 'light' ? 'text-blue-600' : 'text-teal-400'
                      }`}
                    />
                    <h3
                      className={`text-center mb-4 ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}
                    >
                      CV Generated Successfully
                    </h3>
                    <p
                      className={`text-center mb-6 ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}
                    >
                      Your professional CV is ready to download or preview
                    </p>
                    <div className="flex flex-col gap-3 max-w-md mx-auto">
                      <Button
                        onClick={() => setShowPreview(true)}
                        className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Preview CV
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          alert('PDF download functionality would be implemented here')
                        }
                        className={
                          theme === 'light' ? 'border-gray-300' : 'border-gray-700'
                        }
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep('personal')}
                        className={
                          theme === 'light' ? 'border-gray-300' : 'border-gray-700'
                        }
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Edit Information
                      </Button>
                    </div>
                  </div>

                  <div
                    className={`p-6 rounded-xl ${
                      theme === 'light'
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-blue-500/10 border border-blue-500/30'
                    }`}
                  >
                    <h4
                      className={`mb-2 ${
                        theme === 'light' ? 'text-blue-900' : 'text-blue-400'
                      }`}
                    >
                      CV Summary
                    </h4>
                    <ul
                      className={`space-y-2 text-sm ${
                        theme === 'light' ? 'text-blue-800' : 'text-blue-300'
                      }`}
                    >
                      <li>• Name: {fullName || 'Not provided'}</li>
                      <li>• Email: {email || 'Not provided'}</li>
                      <li>• Education entries: {education.length}</li>
                      <li>• Experience entries: {experiences.length}</li>
                      <li>• Skills: {skills.length}</li>
                      <li>• Certifications: {certifications.length}</li>
                      <li>• Languages: {languages.length}</li>
                      <li>• Awards: {awards.length}</li>
                      <li>• Projects: {projects.length}</li>
                    </ul>
                  </div>
                </div>
              )}
            </Card>

            {/* Bottom Navigation */}
            {currentStep !== 'generate' && (
              <div
                className={`mt-6 rounded-2xl shadow-sm p-6 flex items-center justify-between ${
                  theme === 'light'
                    ? 'bg-white border border-gray-200'
                    : 'bg-gray-900/50 border border-gray-800'
                }`}
              >
                <Button
                  variant="outline"
                  onClick={() => {
                    const currentIndex = steps.findIndex((s) => s.id === currentStep);
                    if (currentIndex > 0) {
                      setCurrentStep(steps[currentIndex - 1].id);
                    }
                  }}
                  disabled={currentStep === 'personal'}
                  className={theme === 'light' ? 'border-gray-300' : 'border-gray-700'}
                >
                  Previous
                </Button>

                <div className="flex gap-2">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className={`h-2 w-2 rounded-full ${
                        step.id === currentStep
                          ? 'bg-gradient-to-r from-teal-500 to-cyan-500'
                          : theme === 'light'
                          ? 'bg-gray-300'
                          : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  onClick={async () => {
                    const currentIndex = steps.findIndex((s) => s.id === currentStep);
                    if (currentIndex < steps.length - 1) {
                      await handleSave(); // backend save but UI unchanged
                      setCurrentStep(steps[currentIndex + 1].id);
                    }
                  }}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : currentStep === 'photo' ? (
                    'Generate CV'
                  ) : (
                    'Save and Continue'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Crop Dialog */}
      <ImageCropDialog
        isOpen={isCropDialogOpen}
        onClose={() => setIsCropDialogOpen(false)}
        imageUrl={tempImageUrl}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
