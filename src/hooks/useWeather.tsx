import { useState, useCallback } from 'react'

interface WeatherData {
  condition: string
  temperature: number
  humidity: number
  wind_speed: number
  description: string
}

export function useWeather() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWeather = useCallback(async (lat: number, lon: number): Promise<WeatherData | null> => {
    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY
    if (!apiKey) {
      // Sem chave — retorna dados padrão para não bloquear o fluxo
      return { condition: 'Ensolarado', temperature: 25, humidity: 60, wind_speed: 10, description: 'Ensolarado' }
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`
      )
      if (!res.ok) throw new Error('Erro ao buscar clima')
      const data = await res.json()
      return {
        condition: data.weather[0]?.main || 'Desconhecido',
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        wind_speed: Math.round((data.wind.speed || 0) * 3.6),
        description: data.weather[0]?.description || '',
      }
    } catch {
      setError('Não foi possível buscar o clima')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchByGeolocation = useCallback((): Promise<WeatherData | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const data = await fetchWeather(pos.coords.latitude, pos.coords.longitude)
          resolve(data)
        },
        () => resolve(null),
        { timeout: 8000 }
      )
    })
  }, [fetchWeather])

  return { fetchWeather, fetchByGeolocation, loading, error }
}
