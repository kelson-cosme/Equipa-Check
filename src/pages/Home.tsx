import {  db } from '@/firebaseConfig/firebaseConfig';
import { collection, getDocs } from "firebase/firestore";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CalendarCheck2, Tractor, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';

function Home (){
    const [data, setData] = useState<any[]>([]);
    async function getData() {
        try {
            const querySnapshot = await getDocs(collection(db, "equipamentos"));
            const fetchedData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setData(fetchedData);
        } catch (error) {
            console.error("Error getting documents: ", error);
        }
    }

    useEffect(() => {
        getData();
    }, []);
      
      return(
            <div className='w-[calc(100%-37vh)] p-4'>
                <h1 className="text-2xl font-bold text-[#1F2937]">Visão Geral</h1>
                <p>Acompanhamento de vistorias e equipamentos</p>


            <div className='grid sm:grid-cols-4 gap-4 mt-6 grid-cols-1'>
                <Card>
                    <CardHeader >
                        <div className='flex items-center text-gray-500'>
                            <Tractor width={20} />
                            <CardTitle  className='ml-2 text-gray-500'>Equipamentos Cadastrados</CardTitle>
                        </div>

                        <CardDescription className='font-bold text-2xl text-[#1F2937]'>{data.length <= 0 ? "..." : data.length}</CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <div className='flex items-center text-gray-500'>
                            <Calendar width={20}/>
                            <CardTitle  className='ml-2'>Vistorias para Hoje</CardTitle>
                        </div>
                        <CardDescription className='font-bold text-2xl text-[#1F2937]'>0</CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <div className='flex items-center text-green-500'>
                            <CalendarCheck2 width={20}/>
                            <CardTitle  className='ml-2'>Vistorias Concluídas</CardTitle>
                        </div>
                        <CardDescription className='font-bold text-2xl text-green-500'>0</CardDescription>

                    </CardHeader>

                </Card>

                <Card>
                    <CardHeader>
                        <div className='flex items-center text-[#F59E0B]'>
                            <TriangleAlert className='' width={20} color='#F59E0B'/>
                            <CardTitle className='ml-2'>Vistorias Pendentes</CardTitle>
                        </div>
                        <CardDescription className='text-[#F59E0B] font-bold text-2xl'>0</CardDescription>

                    </CardHeader>
                </Card>
                
</div>


            </div>

    )
}

export default Home