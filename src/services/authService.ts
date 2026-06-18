import {supabase} from './supabase';
import type {User} from '../types';

/**
 * Inscription d'un nouvel utilisateur
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<{user: User | null; error: string | null}> {
  try {
    const {data: authData, error: authError} = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {display_name: displayName},
      },
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return {user: null, error: authError.message};
    }

    if (!authData.user) {
      return {user: null, error: "Échec de l'inscription"};
    }

    // Créer le profil dans la table profiles
    const {error: profileError} = await supabase.from('profiles').insert({
      id: authData.user.id,
      email: authData.user.email,
      display_name: displayName,
    });

    if (profileError) {
      console.error('❌ Profile error:', profileError.message);
      return {user: null, error: 'Erreur création du profil'};
    }

    const user: User = {
      id: authData.user.id,
      email: authData.user.email!,
      display_name: displayName,
      created_at: authData.user.created_at,
    };

    return {user, error: null};
  } catch (err: any) {
    return {user: null, error: err.message || 'Erreur inconnue'};
  }
}

/**
 * Connexion
 */
export async function signIn(
  email: string,
  password: string,
): Promise<{user: User | null; error: string | null}> {
  try {
    const {data: authData, error: authError} =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      return {
        user: null,
        error:
          authError.message === 'Invalid login credentials'
            ? 'Email ou mot de passe incorrect'
            : authError.message,
      };
    }

    if (!authData.user) {
      return {user: null, error: 'Utilisateur non trouvé'};
    }

    // Récupérer le profil
    const {data: profile} = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    const userData: User = {
      id: authData.user.id,
      email: authData.user.email!,
      display_name: profile?.display_name || authData.user.email?.split('@')[0] || 'Utilisateur',
      avatar_url: profile?.avatar_url,
      created_at: authData.user.created_at,
    };

    return {user: userData, error: null};
  } catch (err: any) {
    return {user: null, error: err.message || 'Erreur inconnue'};
  }
}

/**
 * Déconnexion
 */
export async function signOut(): Promise<{error: string | null}> {
  try {
    const {error} = await supabase.auth.signOut();
    if (error) return {error: error.message};
    return {error: null};
  } catch (err: any) {
    return {error: err.message};
  }
}

/**
 * Récupérer l'utilisateur actuel
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const {
      data: {session},
    } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const {data: profile} = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!profile) return null;

    return {
      id: profile.id,
      email: profile.email,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
    };
  } catch {
    return null;
  }
}

/**
 * Mettre à jour le profil
 */
export async function updateProfile(updates: {
  display_name?: string;
  avatar_url?: string;
}): Promise<{error: string | null}> {
  try {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) return {error: 'Non connecté'};

    const {error} = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) return {error: error.message};
    return {error: null};
  } catch (err: any) {
    return {error: err.message};
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string): Promise<{error: string | null}> {
  try {
    const {error} = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'myapp://reset-password',
    });
    if (error) return {error: error.message};
    return {error: null};
  } catch (err: any) {
    return {error: err.message};
  }
}

/**
 * Mettre à jour le mot de passe
 */
export async function updatePassword(newPassword: string): Promise<{error: string | null}> {
  try {
    const {error} = await supabase.auth.updateUser({password: newPassword});
    if (error) return {error: error.message};
    return {error: null};
  } catch (err: any) {
    return {error: err.message};
  }
}

/**
 * Écouter les changements d'auth
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

export default {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  updateProfile,
  resetPassword,
  updatePassword,
  onAuthStateChange,
};