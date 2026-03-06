import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/layout/CartDrawer";

export default function PublicLayout({ children }) {
    return (
        <>
            <Navbar />
            <CartDrawer />
            <main>{children}</main>
            <Footer />
        </>
    );
}
