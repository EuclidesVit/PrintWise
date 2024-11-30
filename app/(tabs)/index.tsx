import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Image,
  Alert,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { usePoints } from "@/components/PontosManager"

type Perfil = {
  tipo: string;
  nome: string;
  foto: string | null;
};

export default function CadastroScreen() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [image, setImage] = useState<string | null>(null);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const { points, loadPoints, updatePoints } = usePoints();


  useFocusEffect(
    useCallback(() => {
        loadPoints();
        loadPerfis();
    }, [])
  );

  const loadPerfis = async (): Promise<void> => {
    try {
      const storedPerfis = await AsyncStorage.getItem('@user_profiles');
      setPerfis(storedPerfis ? JSON.parse(storedPerfis) : []);
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
      Alert.alert('Erro', 'Falha ao carregar perfis salvos.');
    }
  };

  const savePerfis = async (updatedPerfis: Perfil[]): Promise<void> => {
    try {
      await AsyncStorage.setItem('@user_profiles', JSON.stringify(updatedPerfis));
      setPerfis(updatedPerfis);
    } catch (error) {
      console.error('Erro ao salvar perfis:', error);
      Alert.alert('Erro', 'Falha ao salvar perfis.');
    }
  };

  const pickImage = async (): Promise<void> => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permissão Negada', 'Você precisa permitir o acesso à galeria.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const addPerfil = async (): Promise<void> => {
    if (!selectedOption || !name.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    const novoPerfil: Perfil = {
      tipo: selectedOption,
      nome: name.trim(),
      foto: image,
    };

    const updatedPerfis = [...perfis, novoPerfil];
    await savePerfis(updatedPerfis);
    await updatePoints(10); // Adiciona 10 pontos
    resetForm();
    Alert.alert('Sucesso', 'Perfil adicionado com sucesso!');
  };

  const deletePerfil = async (nome: string): Promise<void> => {
    const updatedPerfis = perfis.filter((perfil) => perfil.nome !== nome);
    await savePerfis(updatedPerfis);
    await updatePoints(-10); // Remove 10 pontos
    Alert.alert('Sucesso', 'Perfil removido com sucesso!');
  };

  const resetForm = (): void => {
    setSelectedOption(null);
    setName('');
    setImage(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastro de Usuário</Text>

      <Text style={styles.label}>Escolha o Tipo de Cadastro:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedOption}
          onValueChange={(itemValue) => setSelectedOption(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Selecione uma opção" value={null} />
          <Picker.Item label="Empresa" value="empresa" />
          <Picker.Item label="Pessoal" value="pessoal" />
          <Picker.Item label="Estudo" value="estudo" />
        </Picker>
      </View>

      {selectedOption && (
        <>
          <TextInput
            style={styles.input}
            placeholder={`Nome para ${selectedOption}`}
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
          />
          <Button title="Escolher Foto" onPress={pickImage} />
          {image && <Image source={{ uri: image }} style={styles.imagePreview} />}
        </>
      )}

      <Button title="Salvar Perfil" onPress={addPerfil} />

      <Text style={styles.savedProfilesTitle}>Perfis Salvos:</Text>
      <FlatList
        data={perfis}
        keyExtractor={(item) => item.nome}
        renderItem={({ item }) => (
          <View style={styles.profileCard}>
            {item.foto && <Image source={{ uri: item.foto }} style={styles.profileImage} />}
            <View>
              <Text style={styles.profileName}>{item.nome}</Text>
              <Text style={styles.profileType}>{item.tipo}</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() =>
                Alert.alert(
                  'Confirmar Exclusão',
                  `Deseja realmente excluir o perfil "${item.nome}"?`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Confirmar', onPress: () => deletePerfil(item.nome) },
                  ]
                )
              }
            >
              <Text style={styles.deleteButtonText}>Apagar</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyMessage}>Nenhum perfil salvo.</Text>}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Pontuação Total: {points}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 5,
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
  },
  picker: {
    color: '#fff',
    height: 50,
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#555',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#1a1a1a',
    color: '#fff',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginVertical: 10,
  },
  savedProfilesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 10,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 5,
    marginBottom: 10,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileType: {
    fontSize: 16,
    color: '#ccc',
  },
  deleteButton: {
    marginLeft: 'auto',
    backgroundColor: '#007BFF',
    padding: 8,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#007BFF',
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  footerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
