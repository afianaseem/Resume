import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import client from "../api/client";


const AuthContext = createContext(null);


export function AuthProvider({ children }) {

  const [user, setUser] = useState(() => {

    try {

      const stored =
        localStorage.getItem("user");

      return stored
        ? JSON.parse(stored)
        : null;

    } catch {

      localStorage.removeItem("user");

      return null;
    }
  });


  /*
   * Do not block the entire application while
   * /auth/me waits for a Vercel cold start.
   *
   * The cached user allows the application shell
   * to appear immediately.
   */
  const [loading, setLoading] = useState(true);


  useEffect(() => {

    const token =
      localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }


    let active = true;


    client
      .get("/auth/me")

      .then((res) => {

        if (!active) {
          return;
        }

        setUser(res.data);

        localStorage.setItem(
          "user",
          JSON.stringify(res.data)
        );
      })

      .catch((error) => {

        if (!active) {
          return;
        }

        if (
          error?.response?.status === 401 ||
          error?.response?.status === 403
        ) {

          localStorage.removeItem("token");

          localStorage.removeItem("user");

          setUser(null);
        }
      })

      .finally(() => {

        if (active) {
          setLoading(false);
        }
      });


    return () => {

      active = false;
    };

  }, []);


  const login = async (
    email,
    password
  ) => {

    const res =
      await client.post(
        "/auth/login",
        {
          email,
          password,
        }
      );


    localStorage.setItem(
      "token",
      res.data.access_token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(res.data.user)
    );

    setUser(res.data.user);
  };


  const signup = async (
    name,
    email,
    password
  ) => {

    const res =
      await client.post(
        "/auth/signup",
        {
          name,
          email,
          password,
        }
      );


    localStorage.setItem(
      "token",
      res.data.access_token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(res.data.user)
    );

    setUser(res.data.user);
  };


  const logout = () => {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    setUser(null);
  };


  const updateUser = (updated) => {

    setUser(updated);

    localStorage.setItem(
      "user",
      JSON.stringify(updated)
    );
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {

  const ctx =
    useContext(AuthContext);

  if (!ctx) {

    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return ctx;
}
