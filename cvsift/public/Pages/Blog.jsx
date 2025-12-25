import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, ChevronRight, BookOpen, TrendingUp } from 'lucide-react';
import { PublicHorizontalBannerAd } from '../components/AdSenseAd';
import DOMPurify from 'dompurify';

export default function Blog() {
  const navigate = useNavigate();

  // Blog posts array - you can add more posts here in the future
  const blogPosts = [
    {
      id: 1,
      title: "10 Best Practices for Screening CVs in 2025",
      excerpt: "Learn the most effective techniques for screening CVs efficiently using AI-powered tools and traditional methods. Discover how to identify top talent faster and reduce time-to-hire significantly.",
      date: "January 15, 2025",
      author: "CVSift Team",
      category: "Recruitment Tips",
      readTime: "5 min read",
      featured: true,
      content: `
        <h2>Introduction</h2>
        <p>In today's competitive job market, efficient CV screening is more crucial than ever. With thousands of applications for every position, recruiters need smart strategies to identify the best candidates quickly without missing top talent.</p>

        <h2>1. Use AI-Powered Screening Tools</h2>
        <p>Artificial intelligence has revolutionized the recruitment process. AI-powered CV screening tools like CVSift can process hundreds of CVs in minutes, extracting key information such as skills, experience, education, and qualifications automatically. This eliminates manual data entry and reduces screening time by up to 70%.</p>

        <h2>2. Define Clear Job Requirements</h2>
        <p>Before you start screening CVs, create a detailed job specification that outlines must-have skills, preferred qualifications, and experience levels. This helps you focus on relevant criteria and makes filtering more objective and efficient.</p>

        <h2>3. Look Beyond Keywords</h2>
        <p>While keywords are important, don't rely solely on them. Modern AI tools can understand context and identify candidates with transferable skills. A candidate might not use the exact keyword but could still be highly qualified for the role.</p>

        <h2>4. Implement Blind Screening</h2>
        <p>Remove identifying information such as names, photos, and addresses during the initial screening phase. This reduces unconscious bias and ensures you're evaluating candidates purely on merit and qualifications.</p>

        <h2>5. Create a Scoring System</h2>
        <p>Develop a standardized scoring rubric that assigns points to different qualifications, skills, and experience levels. This makes comparison between candidates more objective and consistent across your hiring team.</p>

        <h2>6. Screen in Batches</h2>
        <p>Rather than reviewing CVs as they arrive, screen them in batches. This allows you to compare candidates side-by-side and maintain consistent evaluation standards throughout the process.</p>

        <h2>7. Use Collaborative Filtering</h2>
        <p>Involve multiple team members in the screening process. Different perspectives can help identify strengths you might have missed and reduce individual biases in candidate evaluation.</p>

        <h2>8. Track Your Metrics</h2>
        <p>Monitor key recruitment metrics like time-to-hire, quality of hire, and candidate satisfaction. These insights help you continuously improve your screening process and identify bottlenecks.</p>

        <h2>9. Automate Initial Responses</h2>
        <p>Set up automated email responses to acknowledge receipt of applications. This improves candidate experience and keeps applicants engaged while you complete the screening process.</p>

        <h2>10. Regular Process Reviews</h2>
        <p>Review and update your screening criteria quarterly. The job market evolves rapidly, and your screening process should adapt to changing skill requirements and industry standards.</p>

        <h2>Conclusion</h2>
        <p>Effective CV screening combines technology, clear criteria, and human judgment. By implementing these best practices, you can significantly reduce time-to-hire while improving the quality of candidates you advance to interviews. Tools like CVSift make this process even more efficient by automating the tedious parts while keeping you in control of the decision-making.</p>

        <p>Ready to transform your recruitment process? <a href="/signup" class="text-accent-600 hover:text-accent-700 font-semibold">Try CVSift free today</a> and experience AI-powered CV screening.</p>
      `
    },
    {
      id: 2,
      title: "How AI is Transforming Recruitment in 2025",
      excerpt: "Explore the latest AI technologies revolutionizing the hiring process, from automated screening to predictive analytics. Understand how artificial intelligence is making recruitment faster, fairer, and more effective.",
      date: "January 10, 2025",
      author: "CVSift Team",
      category: "AI & Technology",
      readTime: "7 min read",
      featured: false,
      content: `
        <h2>The Evolution of Recruitment Technology</h2>
        <p>Artificial Intelligence has fundamentally transformed how companies find, assess, and hire talent. From automating repetitive tasks to providing deep insights into candidate quality, AI is reshaping every stage of the recruitment funnel.</p>

        <h2>1. Automated CV Screening and Parsing</h2>
        <p>AI-powered CV screening tools can automatically extract and categorize information from resumes, identifying key skills, experience, and qualifications. Modern systems like CVSift use natural language processing (NLP) to understand context, not just keywords, ensuring you don't miss qualified candidates who might describe their experience differently.</p>

        <h2>2. Predictive Analytics for Candidate Success</h2>
        <p>Machine learning algorithms can analyze historical hiring data to predict which candidates are most likely to succeed in specific roles. These systems consider factors like skill match, experience patterns, and cultural fit indicators to help recruiters make more informed decisions.</p>

        <h2>3. Bias Reduction and Fair Hiring</h2>
        <p>AI systems, when properly designed, can help reduce unconscious bias in hiring. By focusing on objective criteria and removing identifying information during initial screening, AI tools promote fairer, more inclusive hiring practices.</p>

        <h2>4. Chatbots for Candidate Engagement</h2>
        <p>AI-powered chatbots can answer candidate questions 24/7, schedule interviews automatically, and keep applicants updated throughout the hiring process. This improves candidate experience while freeing up recruiter time for high-value activities.</p>

        <h2>5. Skills Assessment and Testing</h2>
        <p>Advanced AI systems can administer and evaluate skills tests, coding challenges, and situational assessments. These tools provide objective measurements of candidate abilities beyond what's listed on a CV.</p>

        <h2>6. Natural Language Processing for Job Matching</h2>
        <p>NLP algorithms can match candidates to job openings based on semantic understanding of both job descriptions and candidate profiles. This goes beyond simple keyword matching to understand intent and context.</p>

        <h2>The Human Element Remains Critical</h2>
        <p>While AI is incredibly powerful, the human element remains essential in recruitment. AI should augment human decision-making, not replace it. The best recruitment processes combine AI efficiency with human judgment, emotional intelligence, and cultural assessment.</p>

        <h2>Privacy and Ethical Considerations</h2>
        <p>As AI becomes more prevalent in recruitment, it's crucial to address privacy concerns and ensure ethical use of candidate data. Transparent AI systems that explain their decisions and comply with GDPR, CCPA, and other privacy regulations are essential.</p>

        <h2>The Future of AI in Recruitment</h2>
        <p>Looking ahead, we can expect even more sophisticated AI applications in recruitment, including video interview analysis, advanced sentiment detection, and more accurate performance predictions. The key is to adopt these technologies thoughtfully, always keeping candidate experience and fairness at the forefront.</p>

        <h2>Getting Started with AI Recruitment Tools</h2>
        <p>If you're ready to embrace AI in your recruitment process, start with proven tools that offer clear value. CVSift provides AI-powered CV screening that's easy to implement, compliant with privacy regulations, and designed to work alongside your existing processes.</p>

        <p><a href="/signup" class="text-accent-600 hover:text-accent-700 font-semibold">Start your free trial</a> and see how AI can transform your recruitment workflow.</p>
      `
    },
    {
      id: 3,
      title: "Reducing Time-to-Hire: A Complete Guide",
      excerpt: "Discover actionable strategies to accelerate your hiring process without sacrificing candidate quality. Learn how top companies are reducing their time-to-hire by up to 70% using modern recruitment techniques.",
      date: "January 5, 2025",
      author: "CVSift Team",
      category: "HR Strategy",
      readTime: "6 min read",
      featured: false,
      content: `
        <h2>Why Time-to-Hire Matters</h2>
        <p>Time-to-hire is one of the most critical recruitment metrics. A lengthy hiring process can result in losing top candidates to competitors, increased costs, and prolonged team productivity gaps. In today's fast-paced market, speed is essential.</p>

        <h2>Understanding Your Current Process</h2>
        <p>Before you can improve time-to-hire, you need to understand where delays occur. Track these key stages: job posting to first application, application to screening completion, screening to interview invitation, interview to offer, and offer to acceptance.</p>

        <h2>1. Streamline CV Screening with Automation</h2>
        <p>Manual CV screening is often the biggest bottleneck in the hiring process. AI-powered tools like CVSift can reduce screening time from days to minutes, automatically extracting and categorizing candidate information so you can focus on evaluation rather than data entry.</p>

        <h2>2. Optimize Your Job Descriptions</h2>
        <p>Clear, concise job descriptions attract qualified candidates and reduce time spent sorting through irrelevant applications. Include must-have requirements upfront and use inclusive language to attract diverse talent pools.</p>

        <h2>3. Implement Pre-Screening Questions</h2>
        <p>Add knockout questions to your application form to automatically filter out candidates who don't meet basic requirements. This saves screening time and ensures you're only reviewing qualified applicants.</p>

        <h2>4. Use Video Screening Interviews</h2>
        <p>One-way video interviews allow candidates to record responses to preset questions at their convenience. Your team can review these asynchronously, eliminating scheduling delays and accelerating the initial screening phase.</p>

        <h2>5. Reduce Interview Rounds</h2>
        <p>While thorough evaluation is important, excessive interview rounds slow down the process. Combine interview stages where possible and ensure each interview serves a distinct purpose in the evaluation process.</p>

        <h2>6. Accelerate Decision-Making</h2>
        <p>Set strict timelines for interview feedback and hiring decisions. Use collaborative tools that allow hiring teams to share assessments quickly and schedule decision meetings immediately after final interviews.</p>

        <h2>7. Maintain a Talent Pipeline</h2>
        <p>Don't wait until you have an opening to start recruiting. Build relationships with potential candidates through networking, talent communities, and keeping in touch with strong past applicants.</p>

        <h2>8. Improve Your Employer Brand</h2>
        <p>A strong employer brand attracts candidates proactively and can significantly reduce time-to-fill. Invest in showcasing your company culture, employee testimonials, and what makes your organization a great place to work.</p>

        <h2>9. Leverage Employee Referrals</h2>
        <p>Referred candidates typically move through the hiring process faster and have higher retention rates. Implement a robust employee referral program with clear incentives and make it easy for employees to refer candidates.</p>

        <h2>10. Use Recruitment Analytics</h2>
        <p>Track your recruitment funnel metrics to identify exactly where delays occur. Use data to make informed decisions about where to invest in process improvements and technology.</p>

        <h2>Technology as a Force Multiplier</h2>
        <p>Modern recruitment technology can compress your hiring timeline dramatically. Applicant tracking systems, AI screening tools, automated scheduling, and digital offer letters all contribute to faster hiring without compromising quality.</p>

        <h2>Measuring Success</h2>
        <p>Monitor these metrics to track improvement: average time-to-hire, time-to-fill by role, offer acceptance rate, candidate satisfaction scores, and quality of hire. Set benchmarks and continuously optimize your process.</p>

        <h2>Conclusion</h2>
        <p>Reducing time-to-hire requires a combination of process optimization, technology adoption, and cultural change. Start by identifying your biggest bottlenecks and addressing them systematically. Tools like CVSift can help you eliminate the manual CV screening bottleneck, often saving 20+ hours per role.</p>

        <p>Ready to accelerate your hiring process? <a href="/signup" class="text-accent-600 hover:text-accent-700 font-semibold">Try CVSift free</a> and experience automated CV screening.</p>
      `
    }
  ];

  const [selectedPost, setSelectedPost] = useState(null);

  return (
    <div className="min-h-screen bg-white text-secondary-900">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => selectedPost ? setSelectedPost(null) : navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-accent-600 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">{selectedPost ? 'Back to Blog' : 'Back to Home'}</span>
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">CV</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Sift</span>
            </div>
          </div>
        </div>
      </nav>

      {selectedPost ? (
        // Single Blog Post View
        <article className="py-12 lg:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Post Header */}
            <div className="mb-8">
              <div className="inline-flex items-center space-x-2 bg-accent-100 text-accent-700 px-3 py-1 rounded-full mb-4">
                <span className="text-sm font-semibold">{selectedPost.category}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight font-heading">{selectedPost.title}</h1>
              <div className="flex items-center space-x-6 text-gray-600 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar size={16} />
                  <span>{selectedPost.date}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User size={16} />
                  <span>{selectedPost.author}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen size={16} />
                  <span>{selectedPost.readTime}</span>
                </div>
              </div>
            </div>

            {/* AdSense Ad - After title, before content */}
            <PublicHorizontalBannerAd />

            {/* Post Content */}
            <div
              className="prose prose-lg max-w-none mb-12"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(selectedPost.content, {
                  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre'],
                  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
                  ALLOW_DATA_ATTR: false
                })
              }}
            />

            {/* AdSense Ad - After content */}
            <PublicHorizontalBannerAd />

            {/* CTA Section */}
            <div className="mt-12 bg-gradient-to-r from-accent-50 to-accent-100 rounded-2xl p-8 border border-accent-200">
              <h3 className="text-2xl font-bold mb-4 text-secondary-900 font-heading">Ready to Transform Your Hiring Process?</h3>
              <p className="text-gray-700 mb-6">Join 500+ companies using CVSift to screen CVs faster and hire better. Start your free trial today.</p>
              <button
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-700 hover:to-accent-600 text-white px-8 py-3 rounded-lg font-semibold transition-all hover:scale-105 flex items-center space-x-2"
              >
                <span>Get Started Free</span>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </article>
      ) : (
        // Blog List View
        <>
          {/* Hero Section */}
          <section className="pt-16 lg:pt-24 pb-12 lg:pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-accent-50/30 to-white">
            <div className="max-w-7xl mx-auto text-center">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-accent-100 to-accent-50 text-accent-700 px-4 py-2 rounded-full mb-6 border border-accent-200/50">
                <TrendingUp size={16} />
                <span className="text-sm font-semibold">CVSift Blog</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight font-heading">
                Recruitment <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 to-accent-500">Insights</span> & Tips
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Expert advice, industry trends, and best practices for modern recruitment teams. Learn how to hire smarter and faster.
              </p>
            </div>
          </section>

          {/* AdSense Ad - After hero section */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
            <PublicHorizontalBannerAd />
          </div>

          {/* Blog Posts Grid */}
          <section className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {blogPosts.map((post) => (
                  <article
                    key={post.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                    onClick={() => setSelectedPost(post)}
                  >
                    {post.featured && (
                      <div className="bg-gradient-to-r from-accent-500 to-accent-600 text-white px-4 py-2 text-sm font-semibold">
                        Featured Post
                      </div>
                    )}
                    <div className="p-6">
                      <div className="inline-block bg-accent-100 text-accent-700 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                        {post.category}
                      </div>
                      <h2 className="text-xl font-bold mb-3 text-secondary-900 group-hover:text-accent-600 transition-colors font-heading">
                        {post.title}
                      </h2>
                      <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Calendar size={14} />
                          <span>{post.date}</span>
                        </div>
                        <span>{post.readTime}</span>
                      </div>
                      <div className="mt-4 flex items-center text-accent-600 font-semibold group-hover:gap-2 transition-all">
                        <span>Read More</span>
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* AdSense Ad - After blog posts */}
              <div className="mt-12">
                <PublicHorizontalBannerAd />
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-accent-500 via-accent-600 to-accent-700 text-white">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-heading">Start Screening CVs Smarter Today</h2>
              <p className="text-lg mb-8 opacity-90">
                Join hundreds of companies using AI-powered CV screening to hire faster and better.
              </p>
              <button
                onClick={() => navigate('/signup')}
                className="bg-white text-accent-600 px-8 py-4 rounded-xl font-semibold text-lg hover:scale-105 transition-all shadow-xl"
              >
                Try CVSift Free
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
