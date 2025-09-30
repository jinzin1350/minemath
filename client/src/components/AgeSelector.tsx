
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MinecraftSteve, MinecraftBlock } from './MinecraftCharacters';
import { User, GraduationCap, BookOpen } from 'lucide-react';

interface AgeSelectorProps {
  onAgeSelected: (age: number) => void;
  currentAge?: number;
}

// Canadian education system grade mapping
const getGradeInfo = (age: number) => {
  if (age >= 8 && age <= 9) return { grade: "Grade 3", level: "Elementary", description: "Addition & Subtraction basics" };
  if (age >= 10 && age <= 11) return { grade: "Grade 4-5", level: "Elementary", description: "Multiplication & Division introduction" };
  if (age >= 12 && age <= 13) return { grade: "Grade 6-7", level: "Middle School", description: "Advanced operations & fractions" };
  if (age >= 14 && age <= 15) return { grade: "Grade 8-9", level: "High School", description: "Algebra & advanced math" };
  if (age >= 16 && age <= 18) return { grade: "Grade 10-12", level: "High School", description: "Advanced algebra & pre-calculus" };
  return { grade: "Adult", level: "Adult Learning", description: "Comprehensive math review" };
};

const getDifficultyColor = (age: number) => {
  if (age >= 8 && age <= 10) return "bg-green-600 border-green-500";
  if (age >= 11 && age <= 13) return "bg-blue-600 border-blue-500";
  if (age >= 14 && age <= 16) return "bg-purple-600 border-purple-500";
  return "bg-red-600 border-red-500";
};

export function AgeSelector({ onAgeSelected, currentAge }: AgeSelectorProps) {
  const [selectedAge, setSelectedAge] = useState<number>(currentAge || 8);

  const ageOptions = Array.from({ length: 13 }, (_, i) => i + 8); // Ages 8-20

  const handleConfirm = () => {
    onAgeSelected(selectedAge);
  };

  const gradeInfo = getGradeInfo(selectedAge);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-800 to-green-800 p-4 flex items-center justify-center">
      <Card className="border-4 border-amber-600 bg-gradient-to-br from-emerald-900/90 to-cyan-900/90 shadow-2xl backdrop-blur-sm relative overflow-hidden max-w-2xl w-full">
        {/* Floating decorative blocks */}
        <div className="absolute top-2 left-2 opacity-30 animate-float">
          <MinecraftBlock type="grass" size={8} />
        </div>
        <div className="absolute top-2 right-2 opacity-30 animate-float-delay">
          <MinecraftBlock type="stone" size={8} />
        </div>
        <div className="absolute bottom-2 left-8 opacity-20 animate-bounce">
          <MinecraftBlock type="diamond" size={6} />
        </div>

        <CardHeader className="text-center relative z-10">
          <div className="flex justify-center mb-4">
            <MinecraftSteve scale={1.2} />
          </div>
          <CardTitle className="font-pixel text-2xl md:text-3xl text-amber-200 animate-pulse bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent drop-shadow-lg">
            🎓 Select Your Age 📚
          </CardTitle>
          <p className="text-emerald-300 font-pixel text-sm md:text-base">
            Based on Canadian Education System
          </p>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10">
          {/* Age Selection Grid */}
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {ageOptions.map((age) => (
              <Button
                key={age}
                variant={selectedAge === age ? "default" : "outline"}
                onClick={() => setSelectedAge(age)}
                className={`font-pixel h-12 border-2 transition-all duration-200 hover:scale-105 ${
                  selectedAge === age 
                    ? `${getDifficultyColor(age)} text-white` 
                    : 'border-amber-600 hover:border-amber-400'
                }`}
              >
                {age}
              </Button>
            ))}
          </div>

          {/* Selected Age Info */}
          <Card className="border-2 border-cyan-600 bg-gradient-to-br from-cyan-900/50 to-blue-900/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <GraduationCap className="h-6 w-6 text-cyan-400" />
                <div>
                  <h3 className="font-pixel text-cyan-200 text-lg">Age: {selectedAge}</h3>
                  <Badge variant="outline" className="border-cyan-500 text-cyan-300">
                    {gradeInfo.grade}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-300 text-sm">{gradeInfo.level}</span>
                </div>
                <p className="text-gray-300 text-sm">{gradeInfo.description}</p>
              </div>

              {/* Difficulty Preview */}
              <div className="mt-4 p-3 bg-black/30 rounded-lg border border-gray-600">
                <h4 className="font-pixel text-yellow-300 text-sm mb-2">🎯 Math Difficulty Preview:</h4>
                <div className="text-xs text-gray-300 space-y-1">
                  {selectedAge >= 8 && selectedAge <= 9 && (
                    <>
                      <p>• Addition: 5 + 3 = ?</p>
                      <p>• Subtraction: 8 - 2 = ?</p>
                    </>
                  )}
                  {selectedAge >= 10 && selectedAge <= 11 && (
                    <>
                      <p>• Addition: 15 + 27 = ?</p>
                      <p>• Multiplication: 3 × 4 = ?</p>
                    </>
                  )}
                  {selectedAge >= 12 && selectedAge <= 13 && (
                    <>
                      <p>• Multiplication: 12 × 8 = ?</p>
                      <p>• Division: 56 ÷ 7 = ?</p>
                    </>
                  )}
                  {selectedAge >= 14 && selectedAge <= 15 && (
                    <>
                      <p>• Advanced: 15 × 13 = ?</p>
                      <p>• Division: 144 ÷ 12 = ?</p>
                    </>
                  )}
                  {selectedAge >= 16 && (
                    <>
                      <p>• Complex: 25 × 16 = ?</p>
                      <p>• Advanced Division: 289 ÷ 17 = ?</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleConfirm}
              className="font-pixel px-8 py-3 text-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 border-2 border-green-900 text-white shadow-2xl hover:scale-105 transition-all duration-300"
            >
              ✅ Confirm Age Selection 🎮
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
