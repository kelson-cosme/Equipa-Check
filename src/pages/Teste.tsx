import { useEffect, useState } from 'react';
import moment from 'moment';
import { Calendar as BaseCalendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { db } from '@/firebaseConfig/firebaseConfig';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc, Timestamp, getDoc } from "firebase/firestore";

const DnDCalendar = withDragAndDrop(BaseCalendar);
const localizer = momentLocalizer(moment);

interface EquipamentoData {
  checkList?: {
    servicos: Servicos[];
  }[];
}

interface Servicos {
  servicos: string;
  vistoriado: boolean;
}

interface Servico {
  id: string;
  equipamento: string;
  vistoriado: boolean;
  horaTotal: string;
  horasRestantes: string;
  nomeEquipamento: string;
  periodo: {
    periodoValor: number;
    tipo: 'dia' | 'semana';
  };
}

interface CalendarEvent {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: string;
  serviceId: string;
}

interface EventActionsProps {
  event: CalendarEvent;
  onUnschedule: (event: CalendarEvent) => void;
}

// Função modificada para retornar segundos totais
function parseHoraTotal(horaTotal: string): number {
  const [h, m, s] = horaTotal.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

// Função modificada para receber segundos totais
function formatHoraTotal(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function isWeekend(date: Date): boolean {
  return date.getDay() === 0 || date.getDay() === 6;
}

function parseDateWithoutTimezone(dateString: string, timeString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

const EventActions = ({ event, onUnschedule }: EventActionsProps) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onUnschedule(event);
      }}
      className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs transform translate-x-1/2 -translate-y-1/2"
      title="Desagendar"
    >
      ×
    </button>
  );
};

async function saveEventToFirebase(event: CalendarEvent): Promise<string> {
  try {
    const eventRef = doc(collection(db, "calendarioEventos"));
    await setDoc(eventRef, {
      title: event.title,
      start: Timestamp.fromDate(event.start),
      end: Timestamp.fromDate(event.end),
      resource: event.resource,
      serviceId: event.serviceId,
      allDay: event.allDay
    });
    return eventRef.id;
  } catch (error) {
    console.error("Erro ao salvar evento:", error);
    throw error;
  }
}

function Teste() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'day' | 'month'>('week');
  const [data, setData] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Servico | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('08:00');
  const [duration, setDuration] = useState<number>(1);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showEquipmentSelection, setShowEquipmentSelection] = useState(false);
  const [showModalChecklist, setShowModalChecklist] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [equipamentoData, setEquipamentoData] = useState<EquipamentoData | null>(null);

  async function getData() {
    try {
      setLoading(true);
      setError(null);
      
      const querySnapshot = await getDocs(collection(db, "equipamentos"));
      const fetchedData: Servico[] = [];
  
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        
        if (docData.nomeEquipamento && docData.periodo) {
          let horaTotalString = "00:00:00";
          let horasRestantesString = "00:00:00";
          
          // Obter hora total
          if (docData.horaTotal) {
            if (typeof docData.horaTotal === 'string') {
              horaTotalString = docData.horaTotal;
            } else if (docData.horaTotal.seconds) {
              const date = new Date(docData.horaTotal.seconds * 1000);
              horaTotalString = date.toTimeString().split(' ')[0];
            }
          }
          
          // Obter horas restantes com validação
          if (docData.horasRestantes) {
            if (typeof docData.horasRestantes === 'string') {
              // Validar se não excede o tempo total
              const totalSeconds = parseHoraTotal(horaTotalString);
              const restanteSeconds = parseHoraTotal(docData.horasRestantes);
              horasRestantesString = formatHoraTotal(Math.min(totalSeconds, restanteSeconds));
            } else if (docData.horasRestantes.seconds) {
              const date = new Date(docData.horasRestantes.seconds * 1000);
              const restanteSeconds = parseHoraTotal(date.toTimeString().split(' ')[0]);
              const totalSeconds = parseHoraTotal(horaTotalString);
              horasRestantesString = formatHoraTotal(Math.min(totalSeconds, restanteSeconds));
            }
          }
  
          fetchedData.push({
            id: doc.id,
            equipamento: docData.nomeEquipamento,
            nomeEquipamento: docData.nomeEquipamento,
            vistoriado: Boolean(docData.vistoriado),
            horaTotal: horaTotalString,
            horasRestantes: horasRestantesString,
            periodo: {
              periodoValor: Number(docData.periodo?.periodoValor || 1),
              tipo: docData.periodo?.tipo === 'semana' ? 'semana' : 'dia'
            }
          });
        }
  
        if (docData.checkList && Array.isArray(docData.checkList)) {
          docData.checkList.forEach((checkItem: any) => {
            if (checkItem.nomeEquipamento && checkItem.periodo) {
              let horaTotalString = "00:00:00";
              let horasRestantesString = "00:00:00";
              
              if (checkItem.horaTotal) {
                if (typeof checkItem.horaTotal === 'string') {
                  horaTotalString = checkItem.horaTotal;
                } else if (checkItem.horaTotal.seconds) {
                  const date = new Date(checkItem.horaTotal.seconds * 1000);
                  horaTotalString = date.toTimeString().split(' ')[0];
                }
              }
              
              if (checkItem.horasRestantes) {
                if (typeof checkItem.horasRestantes === 'string') {
                  horasRestantesString = checkItem.horasRestantes;
                } else if (checkItem.horasRestantes.seconds) {
                  const date = new Date(checkItem.horasRestantes.seconds * 1000);
                  horasRestantesString = date.toTimeString().split(' ')[0];
                }
              }
  
              fetchedData.push({
                id: doc.id,
                equipamento: checkItem.nomeEquipamento,
                nomeEquipamento: checkItem.nomeEquipamento,
                vistoriado: Boolean(checkItem.vistoriado),
                horaTotal: horaTotalString,
                horasRestantes: horasRestantesString,
                periodo: {
                  periodoValor: Number(checkItem.periodo?.periodoValor || 1),
                  tipo: checkItem.periodo?.tipo === 'semana' ? 'semana' : 'dia'
                }
              });
            }
  
            if (checkItem.servicos && Array.isArray(checkItem.servicos)) {
              checkItem.servicos.forEach((servico: any) => {
                if (servico.nomeEquipamento && servico.periodo) {
                  let horaTotalString = "00:00:00";
                  let horasRestantesString = "00:00:00";
                  
                  if (servico.horaTotal) {
                    if (typeof servico.horaTotal === 'string') {
                      horaTotalString = servico.horaTotal;
                    } else if (servico.horaTotal.seconds) {
                      const date = new Date(servico.horaTotal.seconds * 1000);
                      horaTotalString = date.toTimeString().split(' ')[0];
                    }
                  }
                  
                  if (servico.horasRestantes) {
                    if (typeof servico.horasRestantes === 'string') {
                      horasRestantesString = servico.horasRestantes;
                    } else if (servico.horasRestantes.seconds) {
                      const date = new Date(servico.horasRestantes.seconds * 1000);
                      horasRestantesString = date.toTimeString().split(' ')[0];
                    }
                  }
  
                  fetchedData.push({
                    id: doc.id,
                    equipamento: servico.nomeEquipamento,
                    nomeEquipamento: servico.nomeEquipamento,
                    vistoriado: Boolean(servico.vistoriado),
                    horaTotal: horaTotalString,
                    horasRestantes: horasRestantesString,
                    periodo: {
                      periodoValor: Number(servico.periodo?.periodoValor || 1),
                      tipo: servico.periodo?.tipo === 'semana' ? 'semana' : 'dia'
                    }
                  });
                }
              });
            }
          });
        }
      });
  
      const eventosSnapshot = await getDocs(collection(db, "calendarioEventos"));
      const fetchedEvents: CalendarEvent[] = [];
      
      eventosSnapshot.forEach((doc) => {
        const eventData = doc.data();
        fetchedEvents.push({
          id: doc.id,
          title: eventData.title,
          start: eventData.start.toDate(),
          end: eventData.end.toDate(),
          allDay: eventData.allDay || false,
          resource: eventData.resource,
          serviceId: eventData.serviceId
        });
      });

      setData(fetchedData);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Erro ao buscar dados: ", error);
      setError("Erro ao carregar dados do Firebase");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getData();
  }, []);

  const openModal = (service: Servico, slotInfo?: { start: Date, end: Date }) => {
    setSelectedService(service);
    if (slotInfo) {
      const dateStr = slotInfo.start.toISOString().split('T')[0];
      const timeStr = slotInfo.start.toTimeString().split(' ')[0].substring(0, 5);
      const correctedDate = parseDateWithoutTimezone(dateStr, timeStr);
      
      setSelectedDate(correctedDate);
      setSelectedTime(timeStr);
      setDuration((slotInfo.end.getTime() - slotInfo.start.getTime()) / (1000 * 60 * 60));
    } else {
      setSelectedDate(null);
      setSelectedTime('08:00');
      const horasRestantes = parseHoraTotal(service.horasRestantes) / 3600; // Converter para horas
      setDuration(Math.min(6, horasRestantes));
    }
    setShowModal(true);
    setValidationError(null);
  };

  const handleSchedule = async () => {
    if (!selectedService || !selectedDate) return;
  
    const dateStr = selectedDate.toISOString().split('T')[0];
    const correctedDate = parseDateWithoutTimezone(dateStr, selectedTime);
  
    // Validações adicionais
    const horasTotais = parseHoraTotal(selectedService.horaTotal);
    const horasAtuais = parseHoraTotal(selectedService.horasRestantes);
    const horasSolicitadas = duration * 3600; // Converter horas para segundos
  
    if (horasAtuais > horasTotais) {
      setValidationError("Tempo restante não pode ser maior que o tempo total");
      return;
    }
  
    if (horasSolicitadas > horasAtuais) {
      setValidationError(`Tempo solicitado (${duration}h) excede o tempo restante (${formatHoraTotal(horasAtuais)})`);
      return;
    }
  
    const errors = validateSchedule(selectedService, correctedDate, duration);
    if (errors) {
      setValidationError(errors);
      return;
    }

    const end = new Date(correctedDate);
    end.setTime(correctedDate.getTime() + duration * 60 * 60 * 1000);

    const newEvent: CalendarEvent = {
      title: `${selectedService.nomeEquipamento} (${duration.toFixed(2)}h)`,
      start: correctedDate,
      end,
      allDay: false,
      resource: selectedService.equipamento,
      serviceId: selectedService.id,
    };

    try {
      const horasAtuais = parseHoraTotal(selectedService.horasRestantes);
      const novasHoras = Math.max(0, horasAtuais - duration * 3600); // Converter horas para segundos
      const novasHorasString = formatHoraTotal(novasHoras);
      
      // Atualizar no Firestore como string diretamente
      const docRef = doc(db, "equipamentos", selectedService.id);
      await updateDoc(docRef, {
        horasRestantes: novasHorasString
      });

      const eventId = await saveEventToFirebase(newEvent);
      
      setData(data.map(item => 
        item.id === selectedService.id 
          ? { ...item, horasRestantes: novasHorasString } 
          : item
      ));
      
      setEvents([...events, { ...newEvent, id: eventId }]);
      setShowModal(false);
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error);
      setValidationError("Erro ao atualizar o Firebase");
    }
  };

  const handleUnschedule = async (event: CalendarEvent) => {
    if (!window.confirm(`Deseja realmente desagendar ${event.title}?`)) {
      return;
    }

    try {
      const service = data.find(item => item.id === event.serviceId);
      if (!service) {
        alert("Serviço não encontrado");
        return;
      }

      const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
      const horasAtuais = parseHoraTotal(service.horasRestantes);
      const horasTotais = parseHoraTotal(service.horaTotal);
      const novasHoras = Math.min(horasTotais, horasAtuais + duration * 3600); // Converter horas para segundos
      const novasHorasString = formatHoraTotal(novasHoras);
      
      // Atualizar no Firestore como string diretamente
      const docRef = doc(db, "equipamentos", service.id);
      await updateDoc(docRef, {
        horasRestantes: novasHorasString
      });

      if (event.id) {
        const eventRef = doc(db, "calendarioEventos", event.id);
        await deleteDoc(eventRef);
      }

      setData(data.map(item => 
        item.id === service.id 
          ? { ...item, horasRestantes: novasHorasString } 
          : item
      ));
      setEvents(events.filter(e => e.id !== event.id));
      
      alert("Evento desagendado com sucesso!");
    } catch (error) {
      console.error("Erro ao desagendar:", error);
      alert("Erro ao desagendar evento");
    }
  };

  const validateSchedule = (service: Servico, date: Date, duration: number, eventId?: string): string | null => {
    if (isWeekend(date)) {
      return "Não é possível agendar em finais de semana";
    }

    const dayEvents = events.filter(event => 
      event.start.toDateString() === date.toDateString() &&
      (!eventId || event.id !== eventId)
    );
    
    const totalHours = dayEvents.reduce((sum, event) => {
      return sum + (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
    }, 0);

    if (totalHours + duration > 6) {
      return "Limite de 6 horas por dia excedido";
    }

    const horasRestantes = parseHoraTotal(service.horasRestantes);
    if (duration > horasRestantes) {
      return `Horas insuficientes restantes (${horasRestantes.toFixed(2)}h disponíveis)`;
    }

    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const hasSameEquipmentInWeek = events.some(event => 
      event.resource === service.equipamento &&
      event.start >= weekStart &&
      event.start <= weekEnd &&
      (!eventId || event.id !== eventId)
    );

    if (hasSameEquipmentInWeek) {
      return "Este equipamento já está agendado nesta semana";
    }

    return null;
  };

  const onSelectSlot = (slotInfo: { start: Date, end: Date }) => {
    if (isWeekend(slotInfo.start)) {
      alert("Não é possível agendar em finais de semana");
      return;
    }
    setSelectedDate(slotInfo.start);
    setShowEquipmentSelection(true);
  };

  const handleEquipmentSelection = (service: Servico) => {
    setSelectedService(service);
    setShowEquipmentSelection(false);
    
    const dateStr = selectedDate?.toISOString().split('T')[0] || '';
    const timeStr = selectedDate?.toTimeString().split(' ')[0].substring(0, 5) || '08:00';
    const correctedDate = parseDateWithoutTimezone(dateStr, timeStr);
    
    setSelectedDate(correctedDate);
    setSelectedTime(timeStr);
    const horasRestantes = parseHoraTotal(service.horasRestantes);
    setDuration(Math.min(6, horasRestantes));
    
    setShowModal(true);
  };

  const onEventDrop = async ({ event, start, end }: any) => {
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    const service = data.find(item => item.id === event.serviceId);
    if (!service) {
      alert("Serviço não encontrado");
      return;
    }

    const error = validateSchedule(service, start, duration, event.id);
    if (error) {
      alert(error);
      return;
    }

    try {
      const oldDuration = (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
      const diff = duration - oldDuration;
      
      if (diff !== 0) {
        const horasAtuais = parseHoraTotal(service.horasRestantes);
        const novasHoras = Math.max(0, horasAtuais - diff);
        const novasHorasString = formatHoraTotal(novasHoras);
        
        const [h, m, s] = novasHorasString.split(':').map(Number);
        const date = new Date(0, 0, 0, h, m, s); // Ano 0 = 1900, mas o Firestore corrige
        const timestamp = Timestamp.fromDate(date);

        const docRef = doc(db, "equipamentos", service.id);
        await updateDoc(docRef, {
          horasRestantes: timestamp
        });

        setData(data.map(item => 
          item.id === service.id 
            ? { ...item, horasRestantes: novasHorasString } 
            : item
        ));
      }

      if (event.id) {
        const eventRef = doc(db, "calendarioEventos", event.id);
        await updateDoc(eventRef, {
          start: Timestamp.fromDate(start),
          end: Timestamp.fromDate(end)
        });
      }

      const updatedEvents = events.map(e => 
        e.id === event.id ? { ...e, start, end } : e
      );
      setEvents(updatedEvents);
    } catch (error) {
      console.error("Erro ao atualizar evento:", error);
      alert("Erro ao atualizar o Firebase");
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const colors: Record<string, string> = {
      'Alimentador': '#3b82f6',
      'Correia': '#10b981',
      'Silo': '#f59e0b',
      'default': '#3b82f6'
    };
    
    const service = data.find(item => item.id === event.serviceId);
    const progress = service ? 
      (1 - parseHoraTotal(service.horasRestantes) / parseHoraTotal(service.horaTotal)) * 100 : 0;
    console.log
    return {
      style: {
        backgroundColor: colors[event.resource] || colors.default,
        color: 'white',
        borderRadius: '0.2rem',
        padding: '4px',
        border: 'none',
        fontSize: '0.9rem',
        background: `linear-gradient(90deg, ${colors[event.resource] || colors.default} ${progress}%, 
                    #cccccc ${progress}%)`,
        position: 'relative'
      }
    };
  };

  const components = {
    event: (props: any) => {
      return (
        <div {...props} style={props.style}>
          <div className="rbc-event-content" style={{ height: '100%' }}>
            {props.event.title}
          </div>
          <EventActions event={props.event} onUnschedule={handleUnschedule} />
        </div>
      );
    }
  };

  const handleSelectEvent = async (event: any) => {
    setShowModalChecklist(true);
    const serviceId = event.serviceId;
    setSelectedServiceId(serviceId);
    setLoading(true);
    
    try {
      const docRef = doc(db, "equipamentos", serviceId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("Dados recebidos do Firebase:", data);
      
        // Aqui é onde fazemos o "flatten"
        setEquipamentoData({
          ...data,
          checkList: Array.isArray(data?.checkList)
            ? data.checkList.map(item => ({
                ...item,
                servicos: Array.isArray(item.servicos[0]) ? item.servicos[0] : item.servicos
              }))
            : []
        });
      
      } else {
        console.log("Nenhum documento encontrado com esse ID!");
        setEquipamentoData({ checkList: [] });
      }
    } catch (error) {
      console.error("Erro ao buscar documento:", error);
      setEquipamentoData({ checkList: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = async (checklistIndex: number, servicoIndex: number, newValue: boolean) => {
    if (!equipamentoData?.checkList || !selectedServiceId) return;
  
    try {
      // Atualiza localmente
      const updatedChecklist = [...equipamentoData.checkList];
      updatedChecklist[checklistIndex].servicos[servicoIndex].vistoriado = newValue;
  
      // Atualiza local no estado
      setEquipamentoData({
        ...equipamentoData,
        checkList: updatedChecklist
      });
  
      // Atualiza o documento inteiro no Firebase
      const docRef = doc(db, "equipamentos", selectedServiceId);
      await updateDoc(docRef, {
        checkList: updatedChecklist
      });
  
    } catch (error) {
      console.error("Erro ao atualizar serviço:", error);
    }
  };
  

  if (loading) {
    return (
      <div className="w-full px-4 py-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados do Firebase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-4 py-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
          <h3 className="text-lg font-medium text-red-600 mb-2">Erro ao carregar dados</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={getData}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }
  return (
<div className="w-full px-4 py-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Agendamento de Manutenção</h2>

        </div>

        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Serviços disponíveis:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {data.filter(servico => !servico.vistoriado).map((servico, index) => {
              const horasRestantes = parseHoraTotal(servico.horasRestantes);
              const horasTotais = parseHoraTotal(servico.horaTotal);
              const progresso = horasTotais > 0 ? (1 - horasRestantes / horasTotais) * 100 : 0;
              
              return (
                <div key={index} className="border p-3 rounded-lg">
                  <h4 className="font-medium">{servico.nomeEquipamento}</h4>
                  <p>Tempo total: {servico.horaTotal}</p>
                  <p>Tempo restante: {servico.horasRestantes}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${progresso}%` }}
                    ></div>
                  </div>
                  <p>Período: {servico.periodo.periodoValor} {servico.periodo.tipo === 'semana' ? 'semanas' : 'dias'}</p>
                  <button
                    onClick={() => openModal(servico)}
                    className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    disabled={horasRestantes <= 0}
                  >
                    {horasRestantes > 0 ? 'Agendar' : 'Concluído'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        
        <DndProvider backend={HTML5Backend}>
          <DnDCalendar
            localizer={localizer}
            events={events}
            view={view}
            views={['month', 'week', 'day']}
            defaultView="month"
            step={15}
            timeslots={4}
            defaultDate={currentDate}
            date={currentDate}
            min={new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 8, 0, 0)}
            max={new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 18, 0, 0)}
            onNavigate={(newDate) => setCurrentDate(newDate)}
            onView={(newView) => setView(newView as 'week' | 'day' | 'month')}
            eventPropGetter={eventStyleGetter}
            components={components}
            onSelectEvent={handleSelectEvent}
            onEventDrop={onEventDrop}
            onSelectSlot={onSelectSlot}
            selectable
            draggableAccessor={() => true}
            style={{ height: "60vh" }}
          />
        </DndProvider>
      </div>

      {/* Modal de seleção de equipamento */}
      {showEquipmentSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Selecione o Equipamento</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {data.filter(servico => !servico.vistoriado && parseHoraTotal(servico.horasRestantes) > 0).map((servico, index) => (
                <div 
                  key={index} 
                  className="border p-3 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => handleEquipmentSelection(servico)}
                >
                  <h4 className="font-medium">{servico.nomeEquipamento}</h4>
                  <p>Tempo restante: {servico.horasRestantes}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowEquipmentSelection(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}


      {showModalChecklist && (
        <div className="fixed w-1/2 m-auto inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-content bg-red-500 p-10">
            <h2 className="text-xl font-bold mb-4">Checklist de Serviços</h2>
            <button 
              onClick={() => setShowModalChecklist(false)}
              className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
            >
              Fechar
            </button>

            {loading ? (
              <div className="text-center">Carregando checklist...</div>
            ) : (
              <>
                {!equipamentoData || !equipamentoData.checkList ? (
                  <div className="text-red-500">Nenhum checklist disponível</div>
                ) : (
                  // Acesso direto ao primeiro checklist (índice 0) e seus serviços
                  equipamentoData.checkList[0]?.servicos?.length > 0 ? (
                    <div className="checklist-section mb-6">
                      <h3 className="font-semibold mb-2">Checklist</h3>
                      {equipamentoData.checkList[0].servicos.map((servico, index) => (
                        <div key={`servico-${index}`} className="service-item mb-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={servico?.vistoriado || false}
                              onChange={(e) => handleCheckboxChange(0, index, e.target.checked)}
                              className="h-4 w-4"
                            />
                            <span className={servico?.vistoriado ? "line-through" : ""}>
                              {servico?.servicos || `Serviço ${index + 1}`}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500">Nenhum serviço neste checklist</div>
                  )
                )}
              </>
            )}
          </div>
        </div>
      )}


      {showModal && selectedService && (
        <div  className=" fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Agendar Serviço</h3>
            
            <div className="mb-4">
              <h4 className="font-medium">{selectedService.nomeEquipamento}</h4>
              <p>Tempo total: {selectedService.horaTotal}</p>
              <p>Tempo restante: {selectedService.horasRestantes}</p>
              <p>Período: {selectedService.periodo.periodoValor} {selectedService.periodo.tipo === 'semana' ? 'semanas' : 'dias'}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Data</label>
              <input
                type="date"
                value={selectedDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => {
                  const [year, month, day] = e.target.value.split('-').map(Number);
                  const newDate = new Date(year, month - 1, day);
                  if (selectedTime) {
                    const [hours, minutes] = selectedTime.split(':').map(Number);
                    newDate.setHours(hours, minutes);
                  }
                  setSelectedDate(newDate);
                }}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Hora de Início</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => {
                  setSelectedTime(e.target.value);
                  if (selectedDate) {
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    const newDate = new Date(selectedDate);
                    newDate.setHours(hours, minutes);
                    setSelectedDate(newDate);
                  }
                }}
                min="08:00"
                max="17:00"
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Duração (horas)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => {
                  const newDuration = Number(e.target.value);
                  const horasRestantes = parseHoraTotal(selectedService.horasRestantes);
                  setDuration(Math.min(newDuration, horasRestantes));
                }}
                min="0.5"
                max={parseHoraTotal(selectedService.horasRestantes)}
                step="0.5"
                className="w-full p-2 border rounded"
              />
              <p className="text-sm text-gray-500 mt-1">
                Máximo: {parseHoraTotal(selectedService.horasRestantes).toFixed(1)} horas restantes
              </p>
            </div>

            {validationError && (
              <div className="mb-4 text-red-500 text-sm">
                {validationError}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleSchedule}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={!selectedDate}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Teste;