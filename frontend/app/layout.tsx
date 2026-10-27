import "./globals.css";
import { Toaster } from "sonner";
export const metadata={title:"TaskFlow",description:"A calm workspace for your tasks"};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<Toaster position="top-right"/></body></html>}
