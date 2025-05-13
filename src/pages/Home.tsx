import { db } from '@/firebaseConfig/firebaseConfig';
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CalendarCheck2, Tractor, TriangleAlert, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';


interface Servico {
  vistoriado: boolean;
}

interface CheckListItem {
  servicos: Servico[];
}

interface Equipamento {
  id: string;
  nomeEquipamento: string;
  checkList: CheckListItem[];
}

interface Evento {
  id: string;
  start: Timestamp;
  end: Timestamp;
  resource: string;
}


function Home() {
    const [data, setData] = useState<Equipamento[]>([]);
const [calendarioEventos, setCalendarioEventos] = useState<Evento[]>([]);
    const [completedInspections, setCompletedInspections] = useState(0);
    const [pendingInspections, setPendingInspections] = useState(0);
    const [inspectionsToday, setInspectionsToday] = useState(0);
    const [overdueInspections, setOverdueInspections] = useState(0);

    // Função para verificar se todos os itens estão vistoriados
    const isAllInspected = (equipamento: any) => {
        if (!equipamento.checkList || equipamento.checkList.length === 0) return false;
        return equipamento.checkList.every((item: any) => 
            item.servicos?.every((servico: any) => servico.vistoriado)
        );
    };

    // Função para verificar se uma data já passou
    const isDatePassed = (timestamp: Timestamp) => {
        const now = new Date();
        const date = timestamp.toDate();
        return date < now;
    };

    // Função para verificar se uma data é hoje
    const isToday = (timestamp: Timestamp) => {
        const now = new Date();
        const date = timestamp.toDate();
        return date.toDateString() === now.toDateString();
    };

    async function getData() {
        try {
          const [equipamentosSnapshot, eventosSnapshot] = await Promise.all([
            getDocs(collection(db, "equipamentos")),
            getDocs(collection(db, "calendarioEventos"))
          ]);
      
          const fetchedData: Equipamento[] = equipamentosSnapshot.docs.map(doc => {
            const raw = doc.data();
            return {
              id: doc.id,
              nomeEquipamento: raw.nomeEquipamento,
              checkList: raw.checkList || []
            };
          });
      
          const fetchedEvents: Evento[] = eventosSnapshot.docs.map(doc => {
            const raw = doc.data();
            return {
              id: doc.id,
              start: raw.start instanceof Timestamp ? raw.start : Timestamp.fromDate(new Date(raw.start)),
              end: raw.end instanceof Timestamp ? raw.end : Timestamp.fromDate(new Date(raw.end)),
              resource: raw.resource
            };
          });
      
          setData(fetchedData);
          setCalendarioEventos(fetchedEvents);
      
          // Calcular estatísticas
          const completed = fetchedData.filter(isAllInspected).length;
          const pending = fetchedData.filter(equip => !isAllInspected(equip)).length;
      
          const today = fetchedEvents.filter(event =>
            event.start && isToday(event.start)
          ).length;
      
          const overdue = fetchedEvents.filter(event =>
            event.end && isDatePassed(event.end) &&
            fetchedData.some(equip => equip.id === event.resource && !isAllInspected(equip))
          ).length;
      
          setCompletedInspections(completed);
          setPendingInspections(pending);
          setInspectionsToday(today);
          setOverdueInspections(overdue);
      
        } catch (error) {
          console.error("Erro ao buscar dados:", error);
          if (error instanceof Error) {
            console.error(error.message);
          }
        }
      }
      

    useEffect(() => {
        getData();
    }, []);
    
    // Filtrar equipamentos com todas vistorias concluídas
    const fullyInspectedEquipments = data.filter(isAllInspected);

    return(
        <div className='w-[calc(100%-37vh)] p-4'>
            <h1 className="text-2xl font-bold text-[#1F2937]">Visão Geral</h1>
            <p>Acompanhamento de vistorias e equipamentos</p>

            <div className='grid sm:grid-cols-4 gap-4 mt-6 grid-cols-1'>
                <Card>
                    <CardHeader>
                        <div className='flex items-center text-gray-500'>
                            <Tractor width={20} />
                            <CardTitle className='ml-2 text-gray-500'>Equipamentos</CardTitle>
                        </div>
                        <CardDescription className='font-bold text-2xl text-[#1F2937]'>
                            {data.length <= 0 ? "..." : data.length}
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <div className='flex items-center text-blue-500'>
                            <Calendar width={20} color='#3B82F6'/>
                            <CardTitle className='ml-2'>Para Hoje</CardTitle>
                        </div>
                        <CardDescription className='font-bold text-2xl text-blue-500'>
                            {inspectionsToday}
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <div className='flex items-center text-green-500'>
                            <CalendarCheck2 width={20}/>
                            <CardTitle className='ml-2'>Concluídas</CardTitle>
                        </div>
                        <CardDescription className='font-bold text-2xl text-green-500'>
                            {completedInspections}
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <div className='flex items-center text-[#F59E0B]'>
                            <TriangleAlert width={20} color='#F59E0B'/>
                            <CardTitle className='ml-2'>Atrasadas</CardTitle>
                        </div>
                        <CardDescription className='text-[#F59E0B] font-bold text-2xl'>
                            {overdueInspections}
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>

            {/* Seção para mostrar equipamentos com vistorias completas */}
            {fullyInspectedEquipments.length > 0 && (
                <div className='mt-8'>
                    <h2 className="text-xl font-semibold text-[#1F2937] mb-4 flex items-center">
                        <CheckCircle className="text-green-500 mr-2" size={20} />
                        Equipamentos com vistorias completas
                    </h2>
                    
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {fullyInspectedEquipments.map(equip => (
                            <Card key={equip.id} className="border-l-4 border-green-500">
                                <CardHeader>
                                    <CardTitle>{equip.nomeEquipamento}</CardTitle>
                                    <CardDescription className='text-green-500'>
                                        Vistoria completa
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Seção para mostrar vistorias atrasadas */}
            {overdueInspections > 0 && (
                <div className='mt-8'>
                    <h2 className="text-xl font-semibold text-[#1F2937] mb-4 flex items-center">
                        <TriangleAlert className="text-[#F59E0B] mr-2" size={20} />
                        Vistorias Atrasadas
                    </h2>
                    
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {calendarioEventos
                        .filter(event => 
                            event.end && isDatePassed(event.end) && 
                            data.some(equip => equip.id === event.resource && !isAllInspected(equip))
                        ) // <-- fecha corretamente aqui
                        .map(event => {
                            const equip = data.find(e => e.id === event.resource);
                            return (
                                <Card key={event.id} className="border-l-4 border-[#F59E0B]">
                                    <CardHeader>
                                        <CardTitle>{equip?.nomeEquipamento || 'Equipamento não encontrado'}</CardTitle>
                                        <CardDescription className='text-[#F59E0B]'>
                                            Atrasada desde {event.end.toDate().toLocaleDateString('pt-BR')}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            );
                        })}

                    </div>
                </div>
            )}
        </div>
    )
}

export default Home;