import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePoints} from "@/components/PontosManager"

type PrinterProfile = {
  name: string;
  powerInWatts: number; // Potência da máquina em watts
  regionCost: number; // Preço do kWh na região
  initialCost: number; // Custo inicial da impressora
  usefulLife: number; // Vida útil em horas
  depreciationPerHour: number; // Depreciação por hora
};

export default function ImpressoraScreen() {
  const [name, setName] = useState('');
  const [powerInWatts, setPowerInWatts] = useState('');
  const [regionCost, setRegionCost] = useState('');
  const [initialCost, setInitialCost] = useState('');
  const [usefulLife, setUsefulLife] = useState('');
  const [printers, setPrinters] = useState<PrinterProfile[]>([]);
  const [showModal, setShowModal] = useState(false);
  const { points, loadPoints, updatePoints } = usePoints();

  useEffect(() => {
    loadPrinters();
  }, []);

  const loadPrinters = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const printerKeys = keys.filter((key) => key.startsWith('@printer_'));
      const loadedPrinters = await Promise.all(
        printerKeys.map(async (key) => {
          const printer = await AsyncStorage.getItem(key);
          return printer ? JSON.parse(printer) : null;
        })
      );

      const validPrinters = loadedPrinters.filter((p) => p !== null) as PrinterProfile[];
      setPrinters(validPrinters);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar perfis de impressoras.');
    }
  };

  const savePrinterProfile = async () => {
    if (!name || !powerInWatts || !regionCost || !initialCost || !usefulLife) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    const power = parseFloat(powerInWatts);
    const usefulLifeHours = parseFloat(usefulLife) * 365 * 24;
    const depreciationPerHour =
      usefulLifeHours > 0 ? parseFloat(initialCost) / usefulLifeHours : 0;

    if (isNaN(power) || power <= 0) {
      Alert.alert('Erro', 'A potência deve ser válida e maior que zero.');
      return;
    }

    const printerProfile: PrinterProfile = {
      name,
      powerInWatts: power,
      regionCost: parseFloat(regionCost),
      initialCost: parseFloat(initialCost),
      usefulLife: usefulLifeHours,
      depreciationPerHour,
    };

    try {
      await AsyncStorage.setItem(
        `@printer_${name}`,
        JSON.stringify(printerProfile)
      );
      setPrinters((prevPrinters) => [...prevPrinters, printerProfile]);

      // Incrementa os pontos ao salvar uma nova impressora
      await updatePoints(10);

      Alert.alert('Sucesso', 'Perfil da impressora salvo com sucesso!');
      clearForm();
      setShowModal(false);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao salvar o perfil da impressora.');
    }
  };

  const deletePrinterProfile = async (printerName: string) => {
    try {
      await AsyncStorage.removeItem(`@printer_${printerName}`);
      setPrinters((prevPrinters) =>
        prevPrinters.filter((printer) => printer.name !== printerName)
      );
      Alert.alert('Sucesso', `Perfil "${printerName}" excluído com sucesso.`);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao excluir o perfil da impressora.');
    }
  };

  const clearForm = () => {
    setName('');
    setPowerInWatts('');
    setRegionCost('');
    setInitialCost('');
    setUsefulLife('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuração de Impressoras</Text>
      <Button
        title="Cadastrar Impressora"
        onPress={() => setShowModal(true)}
        color="#007BFF"
      />

      <FlatList
        data={printers}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <View style={styles.printerItem}>
            <Text style={styles.text}>Nome: {item.name}</Text>
            <Text style={styles.text}>Potência: {item.powerInWatts} W</Text>
            <Text style={styles.text}>
              Preço do kWh: R$ {item.regionCost.toFixed(2)}
            </Text>
            <Text style={styles.text}>
              Depreciação por Hora: R$ {item.depreciationPerHour.toFixed(2)}
            </Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() =>
                Alert.alert(
                  'Confirmar Exclusão',
                  `Deseja excluir o perfil "${item.name}"?`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Excluir',
                      style: 'destructive',
                      onPress: () => deletePrinterProfile(item.name),
                    },
                  ]
                )
              }
            >
              <Text style={styles.deleteButtonText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Nome da Impressora"
              placeholderTextColor="#888"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Potência Total (W)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={powerInWatts}
              onChangeText={setPowerInWatts}
            />
            <TextInput
              style={styles.input}
              placeholder="Preço do kWh na Região (R$)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={regionCost}
              onChangeText={setRegionCost}
            />
            <TextInput
              style={styles.input}
              placeholder="Custo Inicial da Impressora (R$)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={initialCost}
              onChangeText={setInitialCost}
            />
            <TextInput
              style={styles.input}
              placeholder="Vida Útil (anos)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={usefulLife}
              onChangeText={setUsefulLife}
            />
            <Button title="Salvar" onPress={savePrinterProfile} color="#007BFF" />
            <Button
              title="Cancelar"
              onPress={() => setShowModal(false)}
              color="#FF4D4D"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
    marginTop: 50,
  },
  input: {
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#555',
    backgroundColor: '#222',
    color: '#FFF',
    padding: 12,
    marginVertical: 8,
    borderRadius: 5,
  },
  printerItem: {
    marginTop: 10,
    padding: 15,
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#222',
    borderColor: '#555',
  },
  text: {
    color: '#FFF',
    fontSize: 16,
  },
  deleteButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FF4D4D',
    borderRadius: 5,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: '90%',
    padding: 25,
    backgroundColor: '#333',
    borderRadius: 10,
  },
});
