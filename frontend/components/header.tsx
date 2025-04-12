import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Search, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px]">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="#" className="text-lg font-medium">
                  Hilfe & Kontakt
                </Link>
                <Link href="#" className="text-lg font-medium">
                  MemberPlus
                </Link>
                <Link href="#" className="text-lg font-medium">
                  Börse
                </Link>
                <Link href="#" className="text-lg font-medium">
                  E-Banking
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center">
            <Image
              src="/raiffeisen-text-logo.png"
              alt="Raiffeisen"
              width={240}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6 mr-4">
            <Link href="#" className="text-sm font-medium hover:text-[#e30613]">
              Hilfe & Kontakt
            </Link>
            <Link href="#" className="text-sm font-medium hover:text-[#e30613]">
              MemberPlus
            </Link>
            <Link href="#" className="text-sm font-medium hover:text-[#e30613]">
              Börse
            </Link>
          </nav>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex hover:bg-white hover:text-black hover:border hover:border-black transition-colors"
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden md:flex bg-black text-white hover:bg-white hover:text-black hover:border hover:border-black transition-colors rounded-none"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Button className="bg-black hover:bg-white hover:text-black hover:border hover:border-black text-white rounded-none transition-colors">
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
