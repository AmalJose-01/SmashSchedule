import { Trophy, Calendar, Users, Target } from 'lucide-react';

const HeroBanner = () => {


     return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900  shadow-2xl mb-8 rounded-xl">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1613918431551-b2ef2720387c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWRtaW50b24lMjBwbGF5ZXIlMjBhY3Rpb258ZW58MXx8fHwxNzY1NzAxNzY4fDA&ixlib=rb-4.1.0&q=80&w=1080)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl transform translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      
      {/* Content */}
      <div className="relative z-10 px-8 py-12 md:px-12 md:py-16">
        <div className="max-w-4xl">
          {/* Main Heading */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-white">
              Badminton Tournament Scheduler
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-6 max-w-2xl">
            Organize, Manage & Track Your Badminton Tournaments with Ease
          </p>
          
          <p className="text-base md:text-lg text-blue-200 mb-8 max-w-3xl leading-relaxed">
            Comprehensive tournament management solution for badminton clubs and organizers. 
            Create tournaments, manage registrations, schedule matches, track scores, and generate 
            knockout brackets - all in one powerful platform.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 hover:bg-white/20 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-6 h-6 text-blue-300" />
                <span className="text-sm text-blue-200">Features</span>
              </div>
              <p className="text-3xl text-white">Easy</p>
              <p className="text-sm text-blue-200 mt-1">Match Scheduling</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 hover:bg-white/20 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 text-purple-300" />
                <span className="text-sm text-purple-200">Manage</span>
              </div>
              <p className="text-3xl text-white">Teams</p>
              <p className="text-sm text-purple-200 mt-1">& Player Registration</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 hover:bg-white/20 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-6 h-6 text-yellow-300" />
                <span className="text-sm text-yellow-200">Track</span>
              </div>
              <p className="text-3xl text-white">Live</p>
              <p className="text-sm text-yellow-200 mt-1">Scores & Standings</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Wave Decoration */}
      <svg 
        className="absolute bottom-0 left-0 w-full h-16 text-white/5" 
        viewBox="0 0 1200 120" 
        preserveAspectRatio="none"
      >
        <path 
          d="M0,0 C150,80 350,0 600,50 C850,100 1050,20 1200,80 L1200,120 L0,120 Z" 
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
export default HeroBanner;
