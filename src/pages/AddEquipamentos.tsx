import { db } from '@/firebaseConfig/firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useState } from 'react';
import ChecklistCard from '@/components/ChecklistCard';
import { toast } from "sonner";

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
  tempoTotal: {
    horas: number;
    minutos: number;
  };
}

function AdicionarEqp() {
  const [novoEquipamento, setNovoEquipamento] = useState<Equipamento>({
    nomeEquipamento: '',
    periodo: { periodoValor: 0, tipo: 'dia' },
    checkList: [{ servicos: [] }],
    tempoTotal: { horas: 0, minutos: 0 }
  });

  const [mostrarCard, setMostrarCard] = useState<boolean>(false);

  const toggleChecklistCard = () => setMostrarCard(!mostrarCard);

  const adicionarEquipamento = async () => {
    if (!novoEquipamento.nomeEquipamento.trim()) {
      toast("Preencha o nome do equipamento", {
        description: "O campo nome é obrigatório.",
      });
      return;
    }

    try {
      const dataInicio = new Date();
      const { horas, minutos } = novoEquipamento.tempoTotal;

      const horaTotalDate = new Date('1970-01-01T00:00:00');
      horaTotalDate.setHours(horas);
      horaTotalDate.setMinutes(minutos);
      horaTotalDate.setSeconds(0);
      horaTotalDate.setMilliseconds(0);

      const { periodoValor, tipo } = novoEquipamento.periodo;

      const horasRestantes = new Date(dataInicio);
      if (tipo === 'dia') {
        horasRestantes.setDate(horasRestantes.getDate() + periodoValor);
      } else if (tipo === 'semana') {
        horasRestantes.setDate(horasRestantes.getDate() + (periodoValor * 7));
      } else if (tipo === 'mes') {
        horasRestantes.setMonth(horasRestantes.getMonth() + periodoValor);
      }

      await addDoc(collection(db, 'equipamentos'), {
        nomeEquipamento: novoEquipamento.nomeEquipamento,
        periodo: novoEquipamento.periodo,
        checkList: novoEquipamento.checkList,
        horaTotal: Timestamp.fromDate(horaTotalDate),
        horasRestantes: Timestamp.fromDate(horasRestantes)
      });

      toast("Equipamento adicionado ✅", {
        description: `${novoEquipamento.nomeEquipamento} foi cadastrado com sucesso!`,
      });

      setNovoEquipamento({
        nomeEquipamento: '',
        periodo: { periodoValor: 0, tipo: 'dia' },
        checkList: [{ servicos: [] }],
        tempoTotal: { horas: 0, minutos: 0 }
      });

    } catch (error) {
      toast("Erro ao cadastrar equipamento", {
        description: `"Erro ao salvar ${novoEquipamento.nomeEquipamento}"`,
      });
    }
  };

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
        <label className="block mb-2">Duração da Manutenção</label>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            max="23"
            value={novoEquipamento.tempoTotal.horas}
            onChange={(e) =>
              setNovoEquipamento(prev => ({
                ...prev,
                tempoTotal: {
                  ...prev.tempoTotal,
                  horas: parseInt(e.target.value)
                }
              }))
            }
            className="p-2 border rounded w-1/2"
            placeholder="Horas"
          />
          <input
            type="number"
            min="0"
            max="59"
            value={novoEquipamento.tempoTotal.minutos}
            onChange={(e) =>
              setNovoEquipamento(prev => ({
                ...prev,
                tempoTotal: {
                  ...prev.tempoTotal,
                  minutos: parseInt(e.target.value)
                }
              }))
            }
            className="p-2 border rounded w-1/2"
            placeholder="Minutos"
          />
        </div>
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
        disabled={
          !novoEquipamento.nomeEquipamento.trim() || 
          novoEquipamento.checkList[0].servicos.length === 0 ||
          novoEquipamento.periodo.periodoValor <= 0
        }
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
