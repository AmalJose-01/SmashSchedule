const Footer = () => {
    return( <div className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-400 text-sm">
            © 2025 Ballarat Masters Badminton Club. All rights reserved.
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Developed by</span>
            <a
              href="#"
              className="text-blue-400 hover:text-blue-300 transition-colors font-semibold"
            >
              Webfluence
            </a>
          </div>
        </div>
      </div>
    </div>)
}
export default Footer
