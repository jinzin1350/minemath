import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MinecraftSteve, MinecraftZombie, MinecraftBlock } from './MinecraftCharacters';
import { Calculator, Target, Trophy, Users, Zap, Heart } from 'lucide-react';

interface LandingPageProps {
  onLogin?: () => void;
}

export function LandingPage({ onLogin }: LandingPageProps) {
  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    } else {
      // Redirect to login API endpoint
      window.location.href = '/api/login';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-800 to-green-800">
      {/* Hero Section */}
      <div className="relative">
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/30"></div>

        <div className="relative z-10 px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center items-center gap-8 mb-8">
              <MinecraftSteve scale={2} />
              <div className="text-6xl animate-pulse">⚔️</div>
              <MinecraftZombie scale={2} />
            </div>

            <h1 className="text-4xl md:text-6xl font-pixel text-white mb-6 leading-tight">
              MINECRAFT
              <br />
              MATH ADVENTURE
            </h1>

            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Learn math the fun way! Solve addition problems to defeat enemies, 
              level up, and track your daily progress.
            </p>

            <div className="space-y-6">
              <Button
                onClick={handleLogin}
                className="font-pixel text-lg px-8 py-4 bg-green-600 hover:bg-green-700 text-white border-2 border-green-400"
                data-testid="button-start-adventure"
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  PLAY NOW - FREE
                </div>
              </Button>

              <div className="bg-black/20 rounded-lg p-4 border border-green-400/30">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-green-400" />
                  <p className="text-lg text-green-200 font-pixel">
                    Quick & Secure Sign In
                  </p>
                </div>
                <div className="text-sm text-gray-300 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-blue-400" />
                    <p>Safe sign-in through secure provider</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-400" />
                    <p>Track your progress & compete with friends</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-400" />
                    <p>No credit card needed • Play instantly</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-pixel text-white text-center mb-12">
            GAME FEATURES
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 border-card-border bg-card/90 backdrop-blur-sm hover-elevate">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-green-500/20 rounded-lg w-fit">
                  <Calculator className="h-8 w-8 text-green-400" />
                </div>
                <CardTitle className="font-pixel text-card-foreground">
                  MATH BATTLES
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Solve addition problems to cast spells and defeat Minecraft enemies. 
                  Each correct answer powers up your character!
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-card-border bg-card/90 backdrop-blur-sm hover-elevate">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-blue-500/20 rounded-lg w-fit">
                  <Target className="h-8 w-8 text-blue-400" />
                </div>
                <CardTitle className="font-pixel text-card-foreground">
                  PROGRESS TRACKING
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Track your daily math practice with beautiful charts. See your 
                  improvement over the last 7 days and build learning streaks!
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-card-border bg-card/90 backdrop-blur-sm hover-elevate">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-purple-500/20 rounded-lg w-fit">
                  <Trophy className="h-8 w-8 text-purple-400" />
                </div>
                <CardTitle className="font-pixel text-card-foreground">
                  LEVEL UP SYSTEM
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Progress through 5 challenging levels with increasingly difficult 
                  problems. Unlock new enemies and earn achievements!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Game Preview */}
      <div className="py-16 px-4 bg-black/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-pixel text-white text-center mb-12">
            HOW IT WORKS
          </h2>

          <Card className="border-2 border-card-border bg-card/90 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                <div className="text-center">
                  <div className="mb-4">
                    <MinecraftSteve isDefending={true} scale={1.5} />
                  </div>
                  <h3 className="font-pixel text-lg text-card-foreground mb-2">1. SOLVE PROBLEMS</h3>
                  <p className="text-sm text-muted-foreground">
                    Answer math questions like "5 + 3 = ?" to power up Steve
                  </p>
                </div>

                <div className="text-center">
                  <div className="mb-4 text-4xl animate-ping">⚡</div>
                  <h3 className="font-pixel text-lg text-card-foreground mb-2">2. CAST SPELLS</h3>
                  <p className="text-sm text-muted-foreground">
                    Correct answers unleash magic attacks on approaching enemies
                  </p>
                </div>

                <div className="text-center">
                  <div className="mb-4">
                    <MinecraftZombie isAttacking={true} scale={1.5} />
                  </div>
                  <h3 className="font-pixel text-lg text-card-foreground mb-2">3. DEFEAT ENEMIES</h3>
                  <p className="text-sm text-muted-foreground">
                    Battle zombies, skeletons, and even dragons as you level up!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats Preview */}
      <div className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-pixel text-white text-center mb-12">
            TRACK YOUR PROGRESS
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="bg-card/90 backdrop-blur-sm border-2 border-card-border rounded-lg p-4 hover-elevate">
                <div className="flex justify-center mb-2">
                  <MinecraftBlock type="diamond" size={32} />
                </div>
                <p className="font-pixel text-2xl text-foreground">1,250</p>
                <p className="text-sm text-muted-foreground">Points Earned</p>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-card/90 backdrop-blur-sm border-2 border-card-border rounded-lg p-4 hover-elevate">
                <div className="flex justify-center mb-2">
                  <Target className="h-8 w-8 text-green-400" />
                </div>
                <p className="font-pixel text-2xl text-foreground">94%</p>
                <p className="text-sm text-muted-foreground">Accuracy</p>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-card/90 backdrop-blur-sm border-2 border-card-border rounded-lg p-4 hover-elevate">
                <div className="flex justify-center mb-2">
                  <Heart className="h-8 w-8 text-red-500 fill-current" />
                </div>
                <p className="font-pixel text-2xl text-foreground">7</p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-card/90 backdrop-blur-sm border-2 border-card-border rounded-lg p-4 hover-elevate">
                <div className="flex justify-center mb-2">
                  <Zap className="h-8 w-8 text-yellow-400" />
                </div>
                <p className="font-pixel text-2xl text-foreground">5</p>
                <p className="text-sm text-muted-foreground">Max Level</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-16 px-4 bg-gradient-to-b from-green-800 to-blue-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-pixel text-white mb-6">
            READY TO START PLAYING?
          </h2>

          <p className="text-lg text-gray-200 mb-8">
            Join thousands of students making math fun and easy!
          </p>

          <div className="space-y-4">
            <Button
              onClick={handleLogin}
              className="font-pixel text-xl px-12 py-6 bg-orange-600 hover:bg-orange-700 text-white border-2 border-orange-400"
              data-testid="button-join-adventure"
            >
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6" />
                START PLAYING NOW
              </div>
            </Button>

            <p className="text-sm text-orange-200">
              Free forever • No credit card needed • Play instantly
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/50 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400 text-sm">
            Made with ❤️ for young mathematicians everywhere
          </p>
        </div>
      </footer>
    </div>
  );
}