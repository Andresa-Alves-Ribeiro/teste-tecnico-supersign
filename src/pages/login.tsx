import React from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import Link from "next/link";

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export default function LoginPage() {
    const router = useRouter();
    const { register, handleSubmit, formState } = useForm({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: any) => {
        const result = await signIn("credentials", {
            redirect: false,
            ...data,
        });

        if (result?.error) {
            toast.error("Erro ao fazer login. Confira seus dados e tente novamente.", {
                duration: 4000,
                position: "top-right",
                style: {
                    background: "#ef4444",
                    color: "#fff",
                },
            });
        } else {
            router.push("/");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center">
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6">Login</h1>
                <div className="mb-4">
                    <label className="block mb-2">Email</label>
                    <input {...register("email")} className="w-full p-2 border rounded" />
                    {formState.errors.email && (
                        <p className="text-red-500 text-sm">{formState.errors.email.message}</p>
                    )}
                </div>
                <div className="mb-6">
                    <label className="block mb-2">Password</label>
                    <input {...register("password")} type="password" className="w-full p-2 border rounded" />
                    {formState.errors.password && (
                        <p className="text-red-500 text-sm">{formState.errors.password.message}</p>
                    )}
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
                    Login
                </button>

                <div className="mt-4">
                    <p className="text-sm text-gray-500">Não tem uma conta? <Link href="/register" className="text-blue-600">Cadastre-se</Link></p>
                </div>
            </form>
        </div>
    );
}