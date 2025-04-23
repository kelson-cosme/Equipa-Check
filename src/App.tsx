import './App.css'
import { BrowserRouter, Link, useLocation } from 'react-router-dom'
import Rotas from '@/rotas/Rotas'
import { Toaster } from "@/components/ui/sonner";
import { Gauge, Tractor, LucideIcon, Calendar1, VerifiedIcon , LayoutList } from "lucide-react"

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  icon: LucideIcon;
}

function NavLink({ to, children, icon: Icon }: NavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`hover:text-blue-600 hover:bg-white rounded-[7px] p-2 flex items-center ${
        isActive ? 'text-blue-600 bg-white' : 'text-gray-800'
      }`}
    >
      <Icon className={`mr-2 ${isActive ? 'text-blue-700' : ''}`} size={30} />
      {children}
    </Link>
  );
}

function App() {
  return (
    <section className='flex'>
      <BrowserRouter>
        <div className='bg-gray-100 w-[37vh] h-screen p-3'>
          <h1 className='text-xl font-semibold'>Equipa-Check</h1>
          <p className='text-[2vh] mb-[5vh]'>Sistema de Vistorias</p>

          <ul className='space-y-2'>
            <li>
              <NavLink to="/" icon={Gauge}>
                Visão Geral
              </NavLink>
            </li>
            
            <li>
              <NavLink to="/adicionar-equipamentos" icon={Tractor}>
                Equipamentos
              </NavLink>
            </li>

            <li>
              <NavLink to="/teste" icon={Calendar1}>
                Calendário
              </NavLink>
            </li>

            <li>
              <NavLink to="/concluidos" icon={VerifiedIcon}>
                Vistorias Concluídas
              </NavLink>
            </li>

            <li>
              <NavLink to="/pendentes" icon={LayoutList}>
                Vistorias Pendentes
              </NavLink>
            </li>
          </ul>
        </div>

        <Rotas />
      </BrowserRouter>

      <Toaster />
    </section>
  )
}

export default App