import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { usePoints } from "@/components/PontosManager"


type Filamento = {
  nome: string;
  material: string;
  cor: string;
  peso: number;
  preco: number;
};

type Printer = {
  name: string;
  powerInWatts: number; // Potência em watts
  regionCost: number; // Custo do kWh na região
  depreciationPerHour: number; // Depreciação por hora
};

export default function CalculationScreen() {
  const [selectedFilamento, setSelectedFilamento] = useState<string>('');
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [materialWeight, setMaterialWeight] = useState<string>('');
  const [printDuration, setPrintDuration] = useState<string>('');
  const [filamentos, setFilamentos] = useState<Filamento[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [materialCost, setMaterialCost] = useState<number | null>(null);
  const [energyCost, setEnergyCost] = useState<number | null>(null);
  const [depreciationCost, setDepreciationCost] = useState<number | null>(null);
  const [totalCost, setTotalCost] = useState<number | null>(null);

  const { updatePoints } = usePoints()

  useFocusEffect(
    useCallback(() => {
      loadFilamentos();
      loadPrinters();
    }, [])
  );

  const loadFilamentos = async (): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const filamentoKeys = keys.filter((key) => key.startsWith('@produto_'));
      const loadedFilamentos = await Promise.all(
        filamentoKeys.map(async (key) => {
          const filamento = await AsyncStorage.getItem(key);
          return filamento ? JSON.parse(filamento) : null;
        })
      );
      setFilamentos(loadedFilamentos.filter((f) => f !== null) as Filamento[]);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar filamentos do estoque.');
    }
  };

  const loadPrinters = async (): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const printerKeys = keys.filter((key) => key.startsWith('@printer_'));
      const loadedPrinters = await Promise.all(
        printerKeys.map(async (key) => {
          const printer = await AsyncStorage.getItem(key);
          return printer ? JSON.parse(printer) : null;
        })
      );
      setPrinters(loadedPrinters.filter((p) => p !== null) as Printer[]);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar perfis de impressoras.');
    }
  };

  const handleCalculateCost = async (): Promise<void> => {

    if (!selectedFilamento || !selectedPrinter || !materialWeight || !printDuration) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos e selecione as opções.');
      return;
    }

    const filamento = filamentos.find((item) => item.nome === selectedFilamento);
    if (!filamento) {
      Alert.alert('Erro', 'Filamento selecionado não encontrado.');
      return;
    }

    const pesoUsado = parseFloat(materialWeight);
    const duracaoImpressao = parseFloat(printDuration);

    if (isNaN(pesoUsado) || pesoUsado <= 0) {
      Alert.alert('Erro', 'Peso inserido inválido.');
      return;
    }

    if (pesoUsado > filamento.peso) {
      Alert.alert('Erro', 'Peso a ser usado excede o disponível no estoque.');
      return;
    }

    if (isNaN(duracaoImpressao) || duracaoImpressao <= 0) {
      Alert.alert('Erro', 'Duração da impressão inválida.');
      return;
    }

    const printer = printers.find((item) => item.name === selectedPrinter);
    if (!printer) {
      Alert.alert('Erro', 'Impressora selecionada não encontrada.');
      return;
    }

    const custoMaterial = (filamento.preco * pesoUsado) / filamento.peso;
    const consumoEnergia = (printer.powerInWatts * duracaoImpressao) / 1000;
    const custoEnergia = consumoEnergia * printer.regionCost;
    const custoDepreciacao = printer.depreciationPerHour * duracaoImpressao;
    const custoTotal = custoMaterial + custoEnergia + custoDepreciacao;

    // Atualiza o peso e o preço do material no estoque
    const pesoRestante = filamento.peso - pesoUsado;
    const precoRestante = (filamento.preco * pesoRestante) / filamento.peso;
    filamento.peso = pesoRestante;
    filamento.preco = precoRestante;

    try {
      await AsyncStorage.setItem(
        `@produto_${filamento.nome}`,
        JSON.stringify(filamento)
      );
      setMaterialCost(custoMaterial);
      setEnergyCost(custoEnergia);
      setDepreciationCost(custoDepreciacao);
      setTotalCost(custoTotal);

      
      await updatePoints(5)
      Alert.alert(
        'Cálculo Realizado!',
        `Peso usado: ${pesoUsado}g\nPeso restante no estoque: ${pesoRestante.toFixed(
          2
        )}g\nPreço restante: R$ ${precoRestante.toFixed(2)}`
      );
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar o estoque após o cálculo.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cálculo de Impressão 3D</Text>

      <Text style={styles.label}>Filamento do Estoque:</Text>
      <Picker
        selectedValue={selectedFilamento}
        onValueChange={(itemValue) => setSelectedFilamento(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Selecione um filamento" value="" />
        {filamentos.map((filamento) => (
          <Picker.Item
            label={`${filamento.nome} (${filamento.cor} - ${filamento.peso.toFixed(2)}g disponíveis)`}
            value={filamento.nome}
            key={filamento.nome}
          />
        ))}
      </Picker>

      <TextInput
        style={styles.input}
        placeholder="Peso do material a ser usado (g)"
        keyboardType="numeric"
        placeholderTextColor="#aaa"
        value={materialWeight}
        onChangeText={setMaterialWeight}
      />

      <Text style={styles.label}>Perfil da Impressora:</Text>
      <Picker
        selectedValue={selectedPrinter}
        onValueChange={(itemValue) => setSelectedPrinter(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Selecione uma impressora" value="" />
        {printers.map((printer) => (
          <Picker.Item label={printer.name} value={printer.name} key={printer.name} />
        ))}
      </Picker>

      <TextInput
        style={styles.input}
        placeholder="Duração da impressão (horas)"
        keyboardType="numeric"
        placeholderTextColor="#aaa"
        value={printDuration}
        onChangeText={setPrintDuration}
      />

      <Button title="Calcular Custo" onPress={handleCalculateCost} color="#007BFF" />

      {materialCost !== null && energyCost !== null && depreciationCost !== null && totalCost !== null && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>Custo do Material: R$ {materialCost.toFixed(2)}</Text>
          <Text style={styles.resultText}>Consumo de Energia: R$ {energyCost.toFixed(2)}</Text>
          <Text style={styles.resultText}>Depreciação da Máquina: R$ {depreciationCost.toFixed(2)}</Text>
          <Text style={styles.resultText}>Custo Total: R$ {totalCost.toFixed(2)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    marginTop: 40,
    textAlign: 'center',
  },
  label: {
    fontSize: 18,
    color: '#fff',
    marginVertical: 8,
  },
  picker: {
    height: 50,
    width: '100%',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 5,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#555',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 10,
    borderRadius: 5,
    marginVertical: 8,
  },
  resultContainer: {
    marginTop: 20,
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 5,
  },
  resultText: {
    color: '#fff',
    fontSize: 16,
  },
});
