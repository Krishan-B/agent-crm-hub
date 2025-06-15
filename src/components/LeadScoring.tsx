
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useEdgeFunctions } from '../hooks/useEdgeFunctions';

interface LeadScoringProps {
  leadId: string;
  onScoreGenerated?: (score: any) => void;
}

const LeadScoring: React.FC<LeadScoringProps> = ({ leadId, onScoreGenerated }) => {
  const [score, setScore] = useState<any>(null);
  const { generateLeadScore, isLoading } = useEdgeFunctions();
  const { toast } = useToast();

  const handleGenerateScore = async () => {
    try {
      const result = await generateLeadScore(leadId);
      setScore(result);
      onScoreGenerated?.(result);
      
      toast({
        title: "AI Score Generated",
        description: `Lead scored ${result.score}/100 (${result.category})`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI lead score",
        variant: "destructive",
      });
    }
  };

  const getScoreColor = (category: string) => {
    switch (category) {
      case 'Hot': return 'bg-red-100 text-red-800';
      case 'Warm': return 'bg-orange-100 text-orange-800';
      case 'Lukewarm': return 'bg-yellow-100 text-yellow-800';
      case 'Cold': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Lead Scoring
        </CardTitle>
        <CardDescription>
          Generate an AI-powered lead score based on multiple factors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!score ? (
          <Button 
            onClick={handleGenerateScore} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Score...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Generate AI Score
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{score.score}/100</div>
                <Badge className={getScoreColor(score.category)}>
                  {score.category}
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateScore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Regenerate'
                )}
              </Button>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Scoring Factors:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {score.factors?.map((factor: string, index: number) => (
                  <li key={index}>• {factor}</li>
                ))}
              </ul>
            </div>
            
            <div className="text-xs text-gray-500">
              Generated: {new Date(score.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeadScoring;
