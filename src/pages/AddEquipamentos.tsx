import { db } from '@/firebaseConfig/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import ChecklistCard from '@/components/ChecklistCard';
import { toast } from "sonner"

interface Servicos {
  trabalho: string;
  vistoriado: boolean;
}

interface Checklist {
  servicos: Servicos[];
}

interface Periodo {
  periodoValor: number;
  tipo: string;
}

interface Equipamento {
  nomeEquipamento: string;
  periodo: Periodo;
  checkList: Checklist[];
  horaTotal: Date;
}

function AdicionarEqp() {
  // Estado para os dados do novo equipamento
  const [novoEquipamento, setNovoEquipamento] = useState<Equipamento>({
    nomeEquipamento: '',
    periodo: {
      periodoValor: 0,
      tipo: 'dia'
    },
    checkList: [{
      servicos: [] // Array vazio inicialmente
    }],
    horaTotal: new Date()
  });

  const [mostrarCard, setMostrarCard] = useState<boolean>(false)

  const toggleChecklistCard = () => {
    setMostrarCard(!mostrarCard);
  };

  // Função para adicionar um novo equipamento
  const adicionarEquipamento = async () => {
    // Validações existentes (nome, checklist, período)
    if (!novoEquipamento.nomeEquipamento.trim()) {
      toast("Este é o título", {
        description: "Esta é a descrição",
      });
      return;
    }
  
    try {
      await addDoc(collection(db, 'equipamentos'), {
        nomeEquipamento: novoEquipamento.nomeEquipamento,
        periodo: novoEquipamento.periodo,
        checkList: novoEquipamento.checkList,
        horaTotal: serverTimestamp()
      });
  
      // Notificação de SUCESSO
      toast("Equipamento adicionado ✅", {
        description: `${novoEquipamento.nomeEquipamento} foi cadastrado com sucesso!`,
      });
  
      // Reset do formulário
      setNovoEquipamento({
        nomeEquipamento: '',
        periodo: { periodoValor: 0, tipo: 'dia' },
        checkList: [{ servicos: [] }],
        horaTotal: new Date()
      });
  
    } catch (error) {
      // Notificação de ERRO
      toast("Falha no cadastro", {
        description: `"Ocorreu um erro ao salvar o equipamento" ${novoEquipamento.nomeEquipamento}`,
      });
    }
  };

  // Atualiza os campos do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNovoEquipamento(prev => ({
      ...prev,
      [name]: value
    }));
  };


  return (
    <div className="p-4 w-[calc(100%-37vh)]">
      <h1 className="text-2xl font-bold mb-4">Adicionar Novo Equipamento</h1>
      
      <div className="mb-4">
        <label className="block mb-2">Nome do Equipamento</label>
        <input
          type="text"
          name="nomeEquipamento"
          value={novoEquipamento.nomeEquipamento}
          onChange={handleChange}
          className="p-2 border rounded w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">Período (Valor)</label>
        <input
          type="number"
          name="periodo.periodoValor"
          value={novoEquipamento.periodo.periodoValor}
          onChange={(e) => setNovoEquipamento(prev => ({
            ...prev,
            periodo: {
              ...prev.periodo,
              periodoValor: parseInt(e.target.value)
            }
          }))}
          className="p-2 border rounded w-full"
        />
      </div>

      {/* Adicionar checklist */}
      <div className='mb-4'> 
        <label className="block mb-2">Adicionar CheckList</label>
        <button 
          onClick={toggleChecklistCard} 
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          {mostrarCard ? '-' : '+'}
        </button>

        <div className="mt-4">
          {novoEquipamento.checkList[0].servicos.length === 0 ? (
            <p className="text-gray-500">Nenhum checklist adicionado</p>
          ) : (
            <div className="space-y-2">
              {novoEquipamento.checkList[0].servicos.map((servico, index) => (
                <div key={index} className="flex items-center p-2 bg-gray-100 rounded">
                  <input
                    type="checkbox"
                    checked={servico.vistoriado}
                    readOnly
                    className="mr-2"
                  />
                  <span className={servico.vistoriado ? 'line-through text-gray-500' : ''}>
                    {servico.trabalho}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {mostrarCard && (
          <ChecklistCard 
            onClose={() => setMostrarCard(false)}
            trabalhos={novoEquipamento.checkList[0].servicos}
            onTrabalhosChange={(novosTrabalhos) => {
              setNovoEquipamento(prev => ({
                ...prev,
                checkList: [{
                  servicos: novosTrabalhos
                }]
              }));
            }}
          />
        )}



      </div>

      

      <div className="mb-4">
        <label className="block mb-2">Tipo de Período</label>
        <select
          value={novoEquipamento.periodo.tipo}
          onChange={(e) => setNovoEquipamento(prev => ({
            ...prev,
            periodo: {
              ...prev.periodo,
              tipo: e.target.value
            }
          }))}
          className="p-2 border rounded w-full"
        >
          <option value="dia">Dia</option>
          <option value="semana">Semana</option>
          <option value="mes">Mês</option>
        </select>
      </div>

      <button
        onClick={adicionarEquipamento}
        disabled={!novoEquipamento.nomeEquipamento.trim() || 
                novoEquipamento.checkList[0].servicos.length === 0 ||
                novoEquipamento.periodo.periodoValor <= 0}
        className={`bg-blue-500 text-white p-2 rounded hover:bg-blue-600 ${
          (!novoEquipamento.nomeEquipamento.trim() || 
          novoEquipamento.checkList[0].servicos.length === 0 ||
          novoEquipamento.periodo.periodoValor <= 0) ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        Adicionar Equipamento
      </button>
    </div>
  );
}

export default AdicionarEqp;