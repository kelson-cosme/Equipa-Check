import { useState, useEffect } from 'react';
import { db } from '@/firebaseConfig/firebaseConfig';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress" // Importe o componente de progresso
import { CalendarClock, Clock, ListTodo } from 'lucide-react';

const formatTimeOnly = (firebaseTimestamp: Timestamp) => {
    if (!firebaseTimestamp?.toDate) return 'Horário inválido';
    return firebaseTimestamp.toDate().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }) + 'h';
};

// Função para calcular o progresso do checklist
const calculateProgress = (checkList: any[]) => {
    if (!checkList || checkList.length === 0) return 0;
    
    let totalItems = 0;
    let completedItems = 0;

    checkList.forEach(item => {
        if (item.servicos && Array.isArray(item.servicos)) {
            item.servicos.forEach((servico: any) => {
                totalItems++;
                if (servico.vistoriado) completedItems++;
            });
        }
    });

    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
};

function Equipamentos() {
    const [equipamentos, setEquipamentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEquipamentos = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'equipamentos'));
                const equipamentosData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setEquipamentos(equipamentosData);
            } catch (error) {
                console.error("Erro ao buscar equipamentos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEquipamentos();
    }, []);

    if (loading) {
        return <div>Carregando equipamentos...</div>;
    }

    return (
        <section className="w-full p-5">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-medium">Equipamentos</h1>
                    <p>Gerenciamento de equipamentos para vistoria</p>   
                </div>
                <div className="bg-blue-700 p-3 text-white rounded-2xl">
                    <button>+ Novo Equipamento</button>
                </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
                {equipamentos.map((e) => {
                    const progress = calculateProgress(e.checkList);
                    const totalItems = e.checkList.reduce((acc: number, item: any) => 
                        acc + (item.servicos?.length || 0), 0);
                    const completedItems = e.checkList.reduce((acc: number, item: any) => 
                        acc + (item.servicos?.filter((s: any) => s.vistoriado).length || 0), 0);

                    return (
                        <Card key={e.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-start">
                                    <span>{e.nomeEquipamento}</span>
                                    <span className="text-sm font-normal bg-gray-100 px-2 py-1 rounded">
                                        {progress}%
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-sm text-gray-600">Progresso:</p>
                                        <Progress value={progress} className="h-2" />
                                    </div>
                                    <p className="text-sm">
                                        {completedItems} de {totalItems} itens concluídos
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className='flex justify-between'>

                            <div className='flex items-center justify-center text-[#1D4ED8]'>
                                <Clock className='mr-1' color='#1D4ED8'/>
                                <p> {e.horaTotal ? formatTimeOnly(e.horaTotal) : 'Sem horário'}</p>
                            </div>

                            <div className='flex items-center justify-center text-[#16803E]'>
                                <CalendarClock className='mr-1' color='#16803E'/>
                                <p>{e.periodo.periodoValor + " " + e.periodo.tipo}</p>
                            </div>

                            <div  className='flex items-center justify-center text-[#7E22CE]'>
                                <ListTodo className='mr-1' color='#7E22CE' />                                
                                <p>{e.checkList.length > 1 ? `${e.checkList.length} items` : `${e.checkList.length} item`}</p>
                            </div>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </section>
    );
}

export default Equipamentos;