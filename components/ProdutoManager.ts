import React, { useState, useEffect, useCallback } from 'react';
import {
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { usePoints } from './PontosManager'

type Produto = {
    nome: string;
    material: string;
    peso: number;
    cor: string;
    preco: number;
};

const [nomeProduto, setNomeProduto] = useState<string>('');
const [materialProduto, setMaterialProduto] = useState<string>('');
const [pesoProduto, setPesoProduto] = useState<string>('');
const [corProduto, setCorProduto] = useState<string>('');
const [precoProduto, setPrecoProduto] = useState<string>('');
const [produtos, setProdutos] = useState<Produto[]>([]);
const [showForm, setShowForm] = useState<boolean>(false);

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


const adicionarProduto = async (): Promise<void> => {
    const { points, loadPoints, updatePoints } = usePoints();

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
    const { points, loadPoints, updatePoints } = usePoints();

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

export { adicionarProduto, apagarProduto, carregarEstoque, nomeProduto, setNomeProduto, materialProduto, setMaterialProduto, pesoProduto, setPesoProduto, corProduto, setCorProduto, precoProduto, setPrecoProduto, showForm, setShowForm, produtos, setProdutos }