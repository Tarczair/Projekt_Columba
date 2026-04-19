//Tutaj stworzy się prosty rozgłaszacz zdarzeń, który posłuży do rozgłaszania o tym że użytkownik się zalogował.
// Dzięki temu strona będzie się dostosowywać i wyświetlać widok automatycznie dla zalogowanych i wylogowanych użytkowników.

//Początkowo myślałem że to zwykła lista ale nie to jest OBIEKT!!!
type Listener = (data?: any) => void; // Opcjonalne przyjmujące każde dane

class AuthEventEmitter {
  private listeners: { [event: string]: Listener[] } = {}; //Prywatny żeby przez przypadek inny komponent nam nie wyczyścił całej listy.
  // Modyfikację lub nasłuch w poprawnej formie pilnują poniższe metody "subscribe", "unsubscribe" i "emit".
  subscribe(event: string, callback: Listener): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  unsubscribe(event: string, callback: Listener): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(
      (listener) => listener !== callback,
    );
  }

  emit(event: string, data?: any): void {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((listener) => listener(data));
  }
  //callback - funkcja wywołania zwrotnego, tutaj zostanie "zawołana" funkcja np z headera czy też menu bar odpowiadająca konkretnym działaniom.
  //dzięki temu nasz strażnik tzn metody "subscribe", "unsubscribe" i "emit" sprawdzą warunki zobaczą czy nie są spełnione przez ! i ewentualnie wykonają działania.

  // Na chłopski rozum - backend to urzędnik, który wystawia nam paszport (token JWT).
  // Frontend to my - musimy nosić ten paszport w kieszeni (localStorage),
  // pokazywać go na żądanie (np. w header Authorization),
  // a kiedy go tracimy/wyrzucamy (logout).
  // z tego powodu poniższe metody służą do zarządzania tym paszportem po stronie frontendu.

  // 1. Usuwa token z localStorage (paszport "wyrzucony")
  // 2. Usuwa dane użytkownika z localStorage
  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    // Emitujemy event - słuchacze (Header, Profile, etc) wiedzą że ktoś się wylogował
    this.emit("authChange", { isLoggedIn: false });
  }

  //   1. Zapisuje token do localStorage (paszport "schowany w kieszeni")
  //   2. Zapisuje dane użytkownika do localStorage (np. id, username)

  login(token: string, user: any): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    }
    // Emitujemy event - słuchacze wiedzą że ktoś się zalogował
    this.emit("authChange", { isLoggedIn: true, user });
  }

  // Sprawdza czy użytkownik jest zalogowany (ma token w localStorage)
  //   true  - jeśli token istnieje w localStorage
  //   false - jeśli token nie istnieje (user wylogowany lub nielogowany)

  isAuthenticated(): boolean {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("token");
    }
    return false;
  }

  //Pobiera token JWT z localStorage
  getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  }

  // Pobiera dane zalogowanego użytkownika z localStorage
  getUser(): any {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  isMemberOf(communityName: string): boolean {
    const user = this.getUser();
    if (!user || !user.communities) return false;

    // Sprawdzamy, czy w tablicy communities istnieje obiekt o danej nazwie
    return user.communities.some(
      (c: any) => c.name.toLowerCase() === communityName.toLowerCase(),
    );
  }
}

export const authEmitter = new AuthEventEmitter();

//Na chłopski rozum - jak tworzy się komponent np header to on daje taki jakby swój "numer telefonu" i mówi że "hej kolego jak ktoś się zaloguje to daj mi znać" i obserwator wysyła każdemu
// kto zostawił ten swój metaforyczny "numer" i rozsyła wiadomość żeby wiedzieli że trzeba wywołać funkcję od aktualizacji widoku. Jest to dynamiczne i nie wymaga ciągłego nasłuchu.
