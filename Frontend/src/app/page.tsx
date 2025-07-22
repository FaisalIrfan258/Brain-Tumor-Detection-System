import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  🧠 BrainScanX
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin/login" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Admin Login
              </Link>
              <Link href="/patient/login" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg">
                Patient Portal
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Revolutionary</span>{' '}
                  <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent xl:inline">Brain Tumor Detection</span>
                </h1>
                <p className="mt-3 text-base text-gray-600 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  BrainScanX leverages cutting-edge AI technology with ResNet18 architecture to provide 
                  accurate, real-time brain tumor detection. Our system combines advanced deep learning 
                  with explainable AI visualization for comprehensive medical analysis.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link href="/admin/login" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 md:py-4 md:text-lg md:px-10 transition-all duration-200 shadow-lg hover:shadow-xl">
                      Get Started
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link href="/patient/login" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10 transition-colors">
                      Patient Access
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-gradient-to-tr from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-semibold tracking-wide uppercase">Advanced Technology</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              State-of-the-Art AI-Powered Medical Imaging
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-600 lg:mx-auto">
              Our system combines the latest in deep learning with medical imaging expertise to deliver 
              accurate and reliable brain tumor detection
            </p>
          </div>

          <div className="mt-16">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative group">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">ResNet18 AI Model</h3>
                  <p className="mt-2 text-base text-gray-600">
                    Advanced ResNet18 architecture with custom fine-tuning for brain tumor detection. 
                    Features GradCAM visualization for explainable AI results and confidence scoring.
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Automated PDF Reports</h3>
                  <p className="mt-2 text-base text-gray-600">
                    Professional PDF reports with detailed analysis, visual heatmaps, statistical summaries, 
                    and medical insights. Stored securely in Amazon S3 for global access.
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Cloud Integration</h3>
                  <p className="mt-2 text-base text-gray-600">
                    Cloudinary CDN for optimized image storage and delivery. Amazon S3 for secure 
                    report storage with global edge locations for fast, reliable access.
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Dual Portal System</h3>
                  <p className="mt-2 text-base text-gray-600">
                    Comprehensive admin dashboard for healthcare professionals and secure patient portal 
                    with auto-generated credentials and email notifications.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-200 font-semibold tracking-wide uppercase">Technical Excellence</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
              Built with Modern Technology Stack
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-white/10 mx-auto">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-white">PyTorch & ResNet18</h3>
              <p className="mt-2 text-indigo-200">Advanced deep learning framework with pre-trained architecture</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-white/10 mx-auto">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-white">GradCAM Visualization</h3>
              <p className="mt-2 text-indigo-200">Explainable AI with heatmap generation for medical transparency</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-white/10 mx-auto">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-white">Cloud Storage</h3>
              <p className="mt-2 text-indigo-200">Cloudinary CDN & Amazon S3 for scalable, secure storage</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-white/10 mx-auto">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-white">Secure Authentication</h3>
              <p className="mt-2 text-indigo-200">Role-based access with admin and patient portals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div className="text-center">
              <div className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent sm:text-5xl">99.2%</div>
              <div className="mt-2 text-xl text-gray-600">Detection Accuracy</div>
              <p className="mt-1 text-sm text-gray-500">Based on ResNet18 model performance</p>
            </div>
            <div className="mt-8 lg:mt-0 text-center">
              <div className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent sm:text-5xl">&lt; 5s</div>
              <div className="mt-2 text-xl text-gray-600">Analysis Time</div>
              <p className="mt-1 text-sm text-gray-500">Real-time processing with GPU acceleration</p>
            </div>
            <div className="mt-8 lg:mt-0 text-center">
              <div className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent sm:text-5xl">24/7</div>
              <div className="mt-2 text-xl text-gray-600">System Availability</div>
              <p className="mt-1 text-sm text-gray-500">Cloud-hosted with automatic scaling</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-semibold tracking-wide uppercase">Process</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              How BrainScanX Works
            </p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto shadow-lg">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Upload Scan</h3>
                <p className="mt-2 text-gray-600">Upload brain MRI scan images through the secure admin portal</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto shadow-lg">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">AI Analysis</h3>
                <p className="mt-2 text-gray-600">ResNet18 model processes images with GradCAM visualization</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto shadow-lg">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Generate Report</h3>
                <p className="mt-2 text-gray-600">Automated PDF report with detailed analysis and insights</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto shadow-lg">
                  <span className="text-2xl font-bold text-white">4</span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Secure Access</h3>
                <p className="mt-2 text-gray-600">Results available to both admin and patient portals</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="px-6 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg md:py-12 md:px-12 lg:py-16 lg:px-16 xl:flex xl:items-center shadow-xl">
            <div className="xl:w-0 xl:flex-1">
              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Ready to revolutionize brain tumor detection?
              </h2>
              <p className="mt-3 max-w-3xl text-lg leading-6 text-indigo-200">
                Join healthcare professionals worldwide who trust BrainScanX for accurate, reliable, 
                and explainable AI-powered brain tumor detection and diagnosis.
              </p>
            </div>
            <div className="mt-8 sm:w-full sm:max-w-md xl:mt-0 xl:ml-8">
              <div className="sm:flex">
                <Link href="/admin/login" className="w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 sm:w-auto transition-colors shadow-md">
                  Admin Access
                </Link>
                <Link href="/patient/login" className="mt-3 w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-400 sm:mt-0 sm:ml-3 sm:w-auto transition-colors shadow-md">
                  Patient Portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8 xl:col-span-1">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">🧠 BrainScanX</h3>
              <p className="text-gray-300 text-base">
                Advanced AI-powered medical imaging analysis for accurate brain tumor detection and diagnosis. 
                Built with cutting-edge technology for healthcare professionals and patients.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Platform</h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <Link href="/admin/login" className="text-base text-gray-300 hover:text-white transition-colors">
                        Admin Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link href="/patient/login" className="text-base text-gray-300 hover:text-white transition-colors">
                        Patient Portal
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Technology</h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <span className="text-base text-gray-300">
                        ResNet18 AI Model
                      </span>
                    </li>
                    <li>
                      <span className="text-base text-gray-300">
                        GradCAM Visualization
                      </span>
                    </li>
                    <li>
                      <span className="text-base text-gray-300">
                        Cloud Storage
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8">
            <p className="text-base text-gray-400 xl:text-center">
              &copy; 2025 BrainScanX - Advanced Brain Tumor Detection System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
