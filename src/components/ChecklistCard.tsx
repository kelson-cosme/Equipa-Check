import { useState } from 'react';

interface Servico {
  trabalho: string;
  vistoriado: boolean;
}

interface ChecklistCardProps {
  onClose: () => void;
  trabalhos: Servico[];
  onTrabalhosChange: (trabalhos: Servico[]) => void;
}

function ChecklistCard({ onClose, trabalhos, onTrabalhosChange }: ChecklistCardProps) {
    const [novoTrabalho, setNovoTrabalho] = useState('');

  const adicionarTrabalho = () => {
    if (novoTrabalho.trim()) {
      const novosTrabalhos = [
        ...trabalhos,
        { trabalho: novoTrabalho, vistoriado: false }
      ];
      onTrabalhosChange(novosTrabalhos);
      setNovoTrabalho('');
    }
  };

  const toggleVistoriado = (index: number) => {
    const novosTrabalhos = [...trabalhos];
    novosTrabalhos[index].vistoriado = !novosTrabalhos[index].vistoriado;
    onTrabalhosChange(novosTrabalhos);
  };

  const removerTrabalho = (index: number) => {
    const novosTrabalhos = trabalhos.filter((_, i) => i !== index);
    onTrabalhosChange(novosTrabalhos);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-blue-600 h-1/2 w-1/2 rounded-2xl p-5 relative flex flex-col">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-xl font-bold hover:text-gray-200"
        >
          ×
        </button>
        
        <h1 className="text-white text-2xl font-bold mb-4">Checklist</h1>
        
        <div className="flex mb-4">
          <input
            type="text"
            value={novoTrabalho}
            onChange={(e) => setNovoTrabalho(e.target.value)}
            placeholder="Novo trabalho"
            className="flex-grow p-2 rounded-l"
          />
          <button 
            onClick={adicionarTrabalho}
            className="bg-green-500 text-white p-2 rounded-r hover:bg-green-600"
          >
            Adicionar
          </button>
        </div>
        
        <div className="overflow-y-auto flex-grow">
          {trabalhos.length === 0 ? (
            <p className="text-white text-center my-4">Nenhum trabalho adicionado</p>
          ) : (
            trabalhos.map((trabalho, index) => (
              <div key={index} className="flex items-center mb-2 bg-blue-500 p-2 rounded">
              <input
                type="checkbox"
                checked={trabalho.vistoriado}
                onChange={() => toggleVistoriado(index)}
                className="mr-2 h-5 w-5"
              />
              <span className={`flex-grow ${trabalho.vistoriado ? 'line-through' : ''}`}>
                {trabalho.trabalho}
              </span>
              <button 
                onClick={() => removerTrabalho(index)}
                className="text-red-300 hover:text-white ml-2"
              >
                Remover
              </button>
            </div>
            ))
        )}
         </div>
      </div>
    </div>
  );
}

export default ChecklistCard;