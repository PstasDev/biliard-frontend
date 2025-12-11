'use client';

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authApi, setAccessToken, setRefreshToken, setUserProfile } from "@/lib/api"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(username, password);
      setAccessToken(response.access);
      setRefreshToken(response.refresh);
      setUserProfile(response.user);
      
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sikertelen bejelentkezés');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 neon-glow">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-3xl font-bold neon-text mb-2">Biliárd</h1>
                <h2 className="text-xl font-semibold">Bejelentkezés</h2>
                <p className="text-muted-foreground text-balance text-sm">
                  SZLG Biliárdbajnokság
                </p>
              </div>
              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}
              <Field>
                <FieldLabel htmlFor="username">Felhasználónév</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="felhasználónév"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Jelszó</FieldLabel>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Field>
                <Button type="submit" disabled={loading} className="w-full wood-border">
                  {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
                </Button>
              </Field>
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:flex items-center justify-center p-8">
            <div className="text-center">
              <div className="mb-6">
                <div className="text-8xl">🎱</div>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-foreground">SZLG</h3>
              <p className="text-muted-foreground">
                Kőbányai Szent László<br />Gimnázium
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Biliárdbajnokság
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
