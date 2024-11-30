import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Alert,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { carregarEstoque, adicionarProduto, apagarProduto } from './ProdutoManager'
import { nomeProduto, setNomeProduto, materialProduto, setMaterialProduto, pesoProduto, setPesoProduto, corProduto, setCorProduto, precoProduto, setPrecoProduto, showForm, setShowForm, produtos, setProdutos } from './ProdutoManager'
import { usePoints } from './PontosManager'

type Produto = {
  nome: string;
  material: string;
  peso: number; // Peso total em gramas
  cor: string;
  preco: number; // Preço total em R$
};

export default function EstoqueScreen() {
  const { points, loadPoints, updatePoints } = usePoints();

  useFocusEffect(
    useCallback(() => {
      carregarEstoque();
      loadPoints(); // Carrega os pontos ao entrar na tela
    }, [])
  );

  const adicionarProduto = async (): Promise<void> => {
    if (nomeProduto && materialProduto && pesoProduto && corProduto && precoProduto) {
      const produto: Produto = {
        nome: nomeProduto,
        material: materialProduto,
        peso: parseFloat(pesoProduto),
        cor: corProduto,
        preco: parseFloat(precoProduto),
      };

      try {
        await AsyncStorage.setItem(`@produto_${produto.nome}`, JSON.stringify(produto));
        setProdutos((prevProdutos) => [...prevProdutos, produto]);

        setNomeProduto('');
        setMaterialProduto('');
        setPesoProduto('');
        setCorProduto('');
        setPrecoProduto('');
        setShowForm(false);

        await updatePoints(10); // Adiciona 10 pontos ao adicionar um produto
        Alert.alert('Sucesso', 'Produto adicionado ao estoque!');
      } catch (error) {
        Alert.alert('Erro', 'Falha ao adicionar o produto.');
      }
    } else {
      Alert.alert('Erro', 'Por favor, preencha todos os campos, incluindo o preço.');
    }
  };

  const apagarProduto = async (nome: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(`@produto_${nome}`);
      setProdutos((prevProdutos) =>
        prevProdutos.filter((produto) => produto.nome !== nome)
      );
      await updatePoints(-10); // Remove 10 pontos ao apagar um produto
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
      <View style={styles.pointsContainer}>
        <Text style={styles.pointsText}>Pontos Acumulados: {points}</Text>
      </View>
      <View style={styles.contentContainer}>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowForm(!showForm)}
        >
          <Text style={styles.toggleButtonText}>
            {showForm ? 'Fechar' : 'Cadastrar Material'}
          </Text>
        </TouchableOpacity>
        {showForm && (
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nome do Produto"
              placeholderTextColor="#888"
              value={nomeProduto}
              onChangeText={setNomeProduto}
            />
            <TextInput
              style={styles.input}
              placeholder="Material"
              placeholderTextColor="#888"
              value={materialProduto}
              onChangeText={setMaterialProduto}
            />
            <TextInput
              style={styles.input}
              placeholder="Peso (g)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={pesoProduto}
              onChangeText={setPesoProduto}
            />
            <TextInput
              style={styles.input}
              placeholder="Cor"
              placeholderTextColor="#888"
              value={corProduto}
              onChangeText={setCorProduto}
            />
            <TextInput
              style={styles.input}
              placeholder="Preço (R$)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={precoProduto}
              onChangeText={setPrecoProduto}
            />
            <Button title="Adicionar ao Estoque" onPress={adicionarProduto} />
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
  pointsContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  pointsText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  toggleButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  toggleButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
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
