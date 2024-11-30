import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Alert,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { usePoints } from "@/components/PontosManager"

type Produto = {
  nome: string;
  material: string;
  peso: number; // Peso total em gramas
  cor: string;
  preco: number; // Preço total em R$
};

export default function EstoqueScreen() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [material, setMaterial] = useState('');
  const [peso, setPeso] = useState('');
  const [cor, setCor] = useState('');
  const [preco, setPreco] = useState('');
  const { loadPoints, updatePoints } = usePoints();

  // Carregar o estoque do AsyncStorage
  const carregarEstoque = async (): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const produtosKeys = keys.filter((key) => key.startsWith('@produto_'));
      const produtosSalvos = await Promise.all(
        produtosKeys.map(async (key) => {
          const produto = await AsyncStorage.getItem(key);
          return produto ? JSON.parse(produto) : null;
        })
      );
      setProdutos(produtosSalvos.filter((p) => p !== null) as Produto[]);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar produtos do estoque.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarEstoque();
      loadPoints();
    }, [])
  );

  // Adicionar novo produto ao estoque
  const adicionarProduto = async (): Promise<void> => {
    if (!nome || !material || !peso || !cor || !preco) {
      Alert.alert('Erro', 'Preencha todos os campos antes de adicionar.');
      return;
    }

    const produto: Produto = {
      nome,
      material,
      peso: parseFloat(peso),
      cor,
      preco: parseFloat(preco),
    };

    try {
      await AsyncStorage.setItem(`@produto_${produto.nome}`, JSON.stringify(produto));
      setProdutos((prevProdutos) => [...prevProdutos, produto]);

      setNome('');
      setMaterial('');
      setPeso('');
      setCor('');
      setPreco('');
      setShowForm(false);
      
      await updatePoints(10);
      Alert.alert('Sucesso', 'Produto adicionado ao estoque!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao adicionar o produto.');
    }
  };

  // Remover produto do estoque
  const apagarProduto = async (nome: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(`@produto_${nome}`);
      setProdutos((prevProdutos) =>
        prevProdutos.filter((produto) => produto.nome !== nome)
      );
      Alert.alert('Sucesso', `O produto "${nome}" foi removido com sucesso.`);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao remover o produto.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Gerenciar Estoque</Text>
      </View>
      <View style={styles.contentContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm(!showForm)}
        >
          <Text style={styles.addButtonText}>
            {showForm ? 'Fechar' : 'Adicionar Novo Filamento'}
          </Text>
        </TouchableOpacity>

        {showForm && (
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nome do Produto"
              placeholderTextColor="#aaa"
              value={nome}
              onChangeText={setNome}
            />
            <TextInput
              style={styles.input}
              placeholder="Material"
              placeholderTextColor="#aaa"
              value={material}
              onChangeText={setMaterial}
            />
            <TextInput
              style={styles.input}
              placeholder="Peso (g)"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              value={peso}
              onChangeText={setPeso}
            />
            <TextInput
              style={styles.input}
              placeholder="Cor"
              placeholderTextColor="#aaa"
              value={cor}
              onChangeText={setCor}
            />
            <TextInput
              style={styles.input}
              placeholder="Preço Total (R$)"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              value={preco}
              onChangeText={setPreco}
            />
            <TouchableOpacity style={styles.addButton} onPress={adicionarProduto}>
              <Text style={styles.addButtonText}>Salvar Filamento</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={produtos}
          keyExtractor={(item) => item.nome}
          renderItem={({ item }) => (
            <View style={styles.productItem}>
              <Text style={styles.productText}>Nome: {item.nome}</Text>
              <Text style={styles.productText}>Material: {item.material}</Text>
              <Text style={styles.productText}>Peso: {item.peso.toFixed(2)}g</Text>
              <Text style={styles.productText}>Cor: {item.cor}</Text>
              <Text style={styles.productText}>Preço: R$ {item.preco.toFixed(2)}</Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() =>
                  Alert.alert(
                    'Confirmar Exclusão',
                    `Tem certeza que deseja excluir o produto "${item.nome}"?`,
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Confirmar', onPress: () => apagarProduto(item.nome) },
                    ]
                  )
                }
              >
                <Text style={styles.deleteButtonText}>Apagar</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerContainer: {
    backgroundColor: '#000',
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    marginBottom: 20,
  },
  input: {
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#555',
    padding: 12,
    marginVertical: 5,
    borderRadius: 5,
    backgroundColor: '#1a1a1a',
    color: '#fff',
  },
  productItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#1a1a1a',
    marginBottom: 10,
    borderRadius: 5,
  },
  productText: {
    color: '#fff',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  addButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
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
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
