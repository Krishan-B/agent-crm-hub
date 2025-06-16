import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DuplicateRecord {
  existingRecord: any;
  newRecord: any;
  matchFields: string[];
  confidence: number;
}

interface DuplicateDetectionResult {
  duplicates: DuplicateRecord[];
  unique: any[];
}

export const useDuplicateDetection = () => {
  const [duplicateResults, setDuplicateResults] = useState<DuplicateDetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const detectDuplicates = async (newRecords: any[]): Promise<DuplicateDetectionResult> => {
    setIsDetecting(true);
    
    try {
      const duplicates: DuplicateRecord[] = [];
      const unique: any[] = [];

      for (const newRecord of newRecords) {
        const potentialDuplicates = await findPotentialDuplicates(newRecord);
        
        if (potentialDuplicates.length > 0) {
          // Find the best match
          const bestMatch = potentialDuplicates.reduce((best, current) => {
            const currentScore = calculateSimilarityScore(newRecord, current);
            const bestScore = calculateSimilarityScore(newRecord, best);
            return currentScore > bestScore ? current : best;
          });

          const confidence = calculateSimilarityScore(newRecord, bestMatch);
          const matchFields = getMatchingFields(newRecord, bestMatch);

          if (confidence >= 0.8) { // 80% confidence threshold
            duplicates.push({
              existingRecord: bestMatch,
              newRecord,
              matchFields,
              confidence
            });
          } else {
            unique.push(newRecord);
          }
        } else {
          unique.push(newRecord);
        }
      }

      const result = { duplicates, unique };
      setDuplicateResults(result);
      return result;
    } finally {
      setIsDetecting(false);
    }
  };

  const findPotentialDuplicates = async (record: any) => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .or(`email.eq.${record.email},phone.eq.${record.phone}`);

    if (error) {
      console.error('Error finding potential duplicates:', error);
      return [];
    }

    return data || [];
  };

  const calculateSimilarityScore = (record1: any, record2: any): number => {
    let score = 0;
    let totalWeight = 0;

    // Email match (highest weight)
    if (record1.email === record2.email) {
      score += 0.5;
    }
    totalWeight += 0.5;

    // Phone match
    if (record1.phone && record2.phone) {
      const phone1 = normalizePhone(record1.phone);
      const phone2 = normalizePhone(record2.phone);
      if (phone1 === phone2) {
        score += 0.3;
      }
    }
    totalWeight += 0.3;

    // Name similarity
    const nameSimilarity = calculateNameSimilarity(
      `${record1.first_name} ${record1.last_name}`,
      `${record2.first_name} ${record2.last_name}`
    );
    score += nameSimilarity * 0.2;
    totalWeight += 0.2;

    return totalWeight > 0 ? score / totalWeight : 0;
  };

  const normalizePhone = (phone: string): string => {
    return phone.replace(/\D/g, '');
  };

  const calculateNameSimilarity = (name1: string, name2: string): number => {
    const normalize = (str: string) => str.toLowerCase().trim();
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    if (n1 === n2) return 1;
    
    // Simple Levenshtein distance approximation
    const len1 = n1.length;
    const len2 = n2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return 1;
    
    let matches = 0;
    for (let i = 0; i < Math.min(len1, len2); i++) {
      if (n1[i] === n2[i]) matches++;
    }
    
    return matches / maxLen;
  };

  const getMatchingFields = (record1: any, record2: any): string[] => {
    const matches: string[] = [];
    
    if (record1.email === record2.email) matches.push('email');
    if (record1.phone && record2.phone && normalizePhone(record1.phone) === normalizePhone(record2.phone)) {
      matches.push('phone');
    }
    if (record1.first_name === record2.first_name) matches.push('first_name');
    if (record1.last_name === record2.last_name) matches.push('last_name');
    
    return matches;
  };

  const resolveDuplicate = async (duplicate: DuplicateRecord, action: 'merge' | 'keep_new' | 'keep_existing') => {
    switch (action) {
      case 'merge':
        // Merge the records, keeping the most recent data
        const mergedData = {
          ...duplicate.existingRecord,
          ...duplicate.newRecord,
          updated_at: new Date().toISOString()
        };
        
        const { error: updateError } = await supabase
          .from('leads')
          .update(mergedData)
          .eq('id', duplicate.existingRecord.id);
          
        if (updateError) throw updateError;
        break;
        
      case 'keep_new':
        // Update existing record with new data
        const { error: replaceError } = await supabase
          .from('leads')
          .update({
            ...duplicate.newRecord,
            updated_at: new Date().toISOString()
          })
          .eq('id', duplicate.existingRecord.id);
          
        if (replaceError) throw replaceError;
        break;
        
      case 'keep_existing':
        // Do nothing, keep existing record
        break;
    }
  };

  return {
    detectDuplicates,
    resolveDuplicate,
    duplicateResults,
    isDetecting
  };
};
