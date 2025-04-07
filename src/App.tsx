import React, { useState } from 'react';
import Groq from 'groq-sdk';
import pdfToText from 'react-pdftotext';
import 'react-toastify/dist/ReactToastify.css';
import { FileText, Upload, Briefcase, Loader2, CheckCircle, AlertCircle, Award, Brain, Target, Lightbulb, BookOpen, Code, MessageSquare, TargetIcon, ArrowBigUpIcon, SearchIcon, Code2, AlertTriangle } from 'lucide-react';
import { RadialBarChart, RadialBar, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast, ToastContainer } from 'react-toastify';

interface AnalysisResult {
  overall_summary: string;
  resume_score: number;
  ats_compatibility: string;
  resume_length: string;
  readability_score: number;
  skills_match: {
    matched: string[];
    missing: string[];
    match_percentage: number;
  };
  soft_skills_match: {
    matched: string[];
    missing: string[];
  };
  technical_proficiency: {
    strong: string[];
    moderate: string[];
    weak_or_missing: string[];
  };
  keywords_analysis: {
    present_keywords: string[];
    missing_keywords: string[];
  };
  job_requirements_coverage: {
    met_requirements: string[];
    missing_requirements: string[];
  };
  experience_alignment: {
    aligned_experience: string[];
    missing_experience_areas: string[];
  };
  tone_of_language: string;
  formatting_issues: string[];
  grammar_issues: string[];
  recommendations: string[];
}

const groq = new Groq({
  dangerouslyAllowBrowser: true,
  apiKey: import.meta.env.VITE_GQOQ_API_KEY,
});

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const App = () => {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const text = await pdfToText(file);
      return text;
    } catch (error) {
      console.error('Failed to extract text from PDF:', error);
      return '';
    }
  };

  const analyzeResume = async () => {
    if (!resumeFile || !jobDescription) {
      alert('Please upload a resume and provide a job description');
      return;
    }

    setLoading(true);

    try {
      const resumeText = await extractTextFromPDF(resumeFile);

      if (!resumeText.trim()) {
        toast.error('Failed to Scan Resume', {
          position: 'top-right',
        });
        setLoading(false);
        return;
      }

      const prompt = `
You are an AI Resume Analyzer designed to help job seekers improve their resumes. Analyze the following resume against the provided job description and return a response in strict JSON format as per the schema below. Give detailed recommendations and insights based on the analysis. Analyze the resume STRICTLY based on the job description.

Respond ONLY with the JSON object.

Schema:
{
  "overall_summary": string,
  "resume_score": number (0 to 100),
  "ats_compatibility": "High" | "Medium" | "Low",
  "resume_length": "Too Short" | "Optimal" | "Too Long",
  "readability_score": number (0 to 100),
  "skills_match": {
    "matched": string[],
    "missing": string[],
    "match_percentage": number (0 to 100)
  },
  "soft_skills_match": {
    "matched": string[],
    "missing": string[]
  },
  "technical_proficiency": {
    "strong": string[],
    "moderate": string[],
    "weak_or_missing": string[]
  },
  "keywords_analysis": {
    "present_keywords": string[],
    "missing_keywords": string[]
  },
  "job_requirements_coverage": {
    "met_requirements": string[],
    "missing_requirements": string[]
  },
  "experience_alignment": {
    "aligned_experience": string[],
    "missing_experience_areas": string[]
  },
  "tone_of_language": "Professional" | "Casual" | "Neutral" | "Aggressive",
  "formatting_issues": string[],
  "grammar_issues": string[],
  "recommendations": string[]
}

Resume:
${resumeText}

Job Description:
${jobDescription}
`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(completion.choices[0].message.content);
      setAnalysisResult(result);
      toast.success('Analysis complete!', {
        position: 'top-right',
      });
    } catch (error) {
      console.error('Failed to analyze resume:', error);
      alert('Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getATSColor = (compatibility: string) => {
    switch (compatibility.toLowerCase()) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const renderScoreChart = (score: number, color: string) => {
    const data = [{ value: score, fill: color }];
    return (
      <RadialBarChart
        width={120}
        height={120}
        cx={60}
        cy={60}
        innerRadius={30}
        outerRadius={50}
        barSize={10}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <RadialBar
          background
          dataKey="value"
          cornerRadius={30}
        />
      </RadialBarChart>
    );
  };

  const renderSkillsDistribution = () => {
    if (!analysisResult) return null;

    const data = [
      { name: 'Strong', value: analysisResult.technical_proficiency.strong.length },
      { name: 'Moderate', value: analysisResult.technical_proficiency.moderate.length },
      { name: 'Weak', value: analysisResult.technical_proficiency.weak_or_missing.length }
    ];

    return (
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderRequirementsCoverage = () => {
    if (!analysisResult) return null;

    const data = [
      {
        name: 'Requirements',
        met: analysisResult.job_requirements_coverage.met_requirements.length,
        missing: analysisResult.job_requirements_coverage.missing_requirements.length,
      }
    ];

    return (
      <ResponsiveContainer width="100%" height={100}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip />
          <Bar dataKey="met" stackId="a" fill="#00C49F" name="Met Requirements" />
          <Bar dataKey="missing" stackId="a" fill="#FF8042" name="Missing Requirements" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderAnalysisResult = () => {
    if (!analysisResult) return null;

    return (
      <div className="mt-8 space-y-6">
        {/* Summary Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Analysis Summary</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-700">Resume Score</h3>
                </div>
                <div className={`text-3xl font-bold ${getScoreColor(analysisResult.resume_score)}`}>
                  {analysisResult.resume_score}%
                </div>
              </div>
              {/* {renderScoreChart(analysisResult.resume_score, '#0088FE')} */}
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-700">ATS Compatibility</h3>
              </div>
              <div className={`text-3xl font-bold ${getATSColor(analysisResult.ats_compatibility)}`}>
                {analysisResult.ats_compatibility}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-700">Readability</h3>
                </div>
                <div className={`text-3xl font-bold ${getScoreColor(analysisResult.readability_score)}`}>
                  {analysisResult.readability_score}%
                </div>
              </div>
              {/* {renderScoreChart(analysisResult.readability_score, '#00C49F')} */}
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Code2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-700">Skills Match</h3>
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(analysisResult.skills_match.match_percentage)}`}>
                {analysisResult.skills_match.match_percentage}%
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-700">Missing Skills</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysisResult.skills_match.missing.map((skill, index) => (
                  <span key={index} className="px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

          </div>

          <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
            <p className="text-gray-800 leading-relaxed">{analysisResult.overall_summary}</p>
          </div>
        </div>

        {/* Technical Proficiency */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <Code className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Technical Proficiency</h2>
          </div>
          {renderSkillsDistribution()}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Strong Skills</h3>
              <div className="space-y-2">
                {analysisResult.technical_proficiency.strong.map((skill, index) => (
                  <div key={index} className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Moderate Skills</h3>
              <div className="space-y-2">
                {analysisResult.technical_proficiency.moderate.map((skill, index) => (
                  <div key={index} className="flex items-center gap-2 text-yellow-600">
                    <Target className="w-4 h-4" />
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Areas for Improvement</h3>
              <div className="space-y-2">
                {analysisResult.technical_proficiency.weak_or_missing.map((skill, index) => (
                  <div key={index} className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Keywords */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <SearchIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Keyword Analysis</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Present</h3>
              <div className="flex flex-wrap gap-2">
                {analysisResult.keywords_analysis.present_keywords.map((skill, index) => (
                  <span key={index} className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Missing</h3>
              <div className="flex flex-wrap gap-2">
                {analysisResult.keywords_analysis.missing_keywords.map((skill, index) => (
                  <span key={index} className="px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Requirements Coverage */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Job Requirements Coverage</h2>
          </div>
          {renderRequirementsCoverage()}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Met Requirements</h3>
              <div className="space-y-2">
                {analysisResult.job_requirements_coverage.met_requirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Missing Requirements</h3>
              <div className="space-y-2">
                {analysisResult.job_requirements_coverage.missing_requirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Soft Skills */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Soft Skills Analysis</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Present Soft Skills</h3>
              <div className="flex flex-wrap gap-2">
                {analysisResult.soft_skills_match.matched.map((skill, index) => (
                  <span key={index} className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Missing Soft Skills</h3>
              <div className="flex flex-wrap gap-2">
                {analysisResult.soft_skills_match.missing.map((skill, index) => (
                  <span key={index} className="px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>



        {/* Additional Information */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Additional Insights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Resume Details</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Length</span>
                  <span className="font-medium">{analysisResult.resume_length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Tone</span>
                  <span className="font-medium">{analysisResult.tone_of_language}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Formatting & Grammar Issues</h3>
              <div className="space-y-2">
                {analysisResult.formatting_issues.map((issue, index) => (
                  <div key={index} className="flex items-center gap-2 text-yellow-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{issue}</span>
                  </div>
                ))}
                {analysisResult.grammar_issues.map((issue, index) => (
                  <div key={index} className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Recommendations</h2>
          </div>
          <div className="space-y-4">
            {analysisResult.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex-shrink-0 mt-1">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">ATSight AI</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload your resume and job description to get detailed analysis and personalized recommendations!
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Upload Resume</h2>
                </div>
                <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-blue-400 transition-colors duration-200">
                  <div className="space-y-2 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="sr-only"
                          onChange={handleResumeUpload}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF up to 10MB</p>
                  </div>
                </div>
                {resumeFile && (
                  <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Selected file: {resumeFile.name}</span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Job Description</h2>
                </div>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                  className="mt-2 p-2 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Paste the job description here..."
                />
              </div>

              <button
                onClick={analyzeResume}
                disabled={loading || !resumeFile || !jobDescription}
                className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-transparent rounded-xl text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Resume
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    Analyze Resume
                  </>
                )}
              </button>
            </div>
          </div>

          {renderAnalysisResult()}
        </div>
      </div>
    </>
  );
};

export default App;