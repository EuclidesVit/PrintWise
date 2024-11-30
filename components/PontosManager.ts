import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const usePoints = () => {
    const [points, setPoints] = useState<number>(0);
  
    const loadPoints = useCallback(async (): Promise<void> => {
      try {
        const storedPoints = await AsyncStorage.getItem('@user_points');
        const parsedPoints = storedPoints ? parseInt(storedPoints, 10) : 0;
        setPoints(parsedPoints);
      } catch (error) {
        console.error('Erro ao carregar pontos:', error);
        Alert.alert('Erro', 'Falha ao carregar os pontos.');
      }
    }, []);
  
    const updatePoints = useCallback(async (newPoints: number): Promise<void> => {
      try {
        const updatedPoints = points + newPoints;
        setPoints(updatedPoints);
        await AsyncStorage.setItem('@user_points', updatedPoints.toString());
      } catch (error) {
        console.error('Erro ao atualizar pontos:', error);
        Alert.alert('Erro', 'Falha ao atualizar os pontos.');
      }
    }, [points]);
  
    // Use o useEffect para carregar pontos automaticamente quando o hook é usado
    useEffect(() => {
      loadPoints();
    }, [loadPoints]);
  
    return { points, loadPoints, updatePoints };
  };