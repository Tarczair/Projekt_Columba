import { Header } from "./components/header/Header";
import { Footer } from "./components/footer/Footer";
import { PostArea } from "./components/post_area/PostArea"

export function MainView() {
    return(
        <main>
            <Header/>
            <PostArea/>
            <Footer/>
        </main>
    );
}