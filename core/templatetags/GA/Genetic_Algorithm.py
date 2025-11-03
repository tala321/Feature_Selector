import pandas as pd
import numpy as np
import random
import sqlite3
import datetime
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import LabelEncoder



def load_and_preprocess_data(file_path, target_column_name='Target'):

    try:
        data = pd.read_csv(file_path)
    except FileNotFoundError:
        print(f"[ERROR] File not found at {file_path}")
        return None, None, None
    except Exception as e:
        print(f"[ERROR] Error loading data: {e}")
        return None, None, None

    if target_column_name not in data.columns:
        print(f"[ERROR] Target column '{target_column_name}' not found.")
        return None, None, None

    X = data.drop(columns=[target_column_name])
    y = data[target_column_name]


    le = LabelEncoder()
    for column in X.columns:
        if X[column].dtype == 'object': 
            X[column] = X[column].astype(str).fillna('MISSING')
            X[column] = le.fit_transform(X[column])

 
    if y.dtype == 'object':
        y = le.fit_transform(y)
    

    X = X.fillna(0) 

    return X.values, y.values, X.shape[1] 



class CandidateSolution:
    def __init__(self, genes): 
        self.genes = genes  
        self.fitness = 0.0

def generate_population(pop_count, feature_count):
    return [CandidateSolution(np.random.randint(0, 2, size=feature_count).tolist()) for _ in range(pop_count)]

def duplicate_candidate(sol):
    return CandidateSolution(list(sol.genes))

def select_via_tournament(population, k):
    pool = random.sample(population, k)
    return max(pool, key=lambda sol: sol.fitness)

def recombine_parents(p1, p2):
    crossover_point = random.randint(1, len(p1.genes) - 1)
    
    child1_genes = p1.genes[:crossover_point] + p2.genes[crossover_point:]
    child2_genes = p2.genes[:crossover_point] + p1.genes[crossover_point:]
    
    return CandidateSolution(child1_genes), CandidateSolution(child2_genes)

def apply_random_mutation(sol, prob):
    for i in range(len(sol.genes)):
        if random.random() < prob:
            sol.genes[i] = 1 - sol.genes[i] 


GLOBAL_X = None
GLOBAL_Y = None

def assess_fitness(solution, feature_scores):

    global GLOBAL_X, GLOBAL_Y

    if GLOBAL_X is None or GLOBAL_Y is None:
        return 0.0 

    selected_feature_indices = [i for i, gene in enumerate(solution.genes) if gene == 1]

    if not selected_feature_indices:
        return 0.0

    X_selected = GLOBAL_X[:, selected_feature_indices]
    y = GLOBAL_Y

    X_train, X_test, y_train, y_test = train_test_split(X_selected, y, test_size=0.3, random_state=42)

    model = LogisticRegression(max_iter=1000) 
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)

    return accuracy


def save_results_to_db(fitness, optimal_features_indices, chromosome_genes, db_file='ga_results.db'):

    try:
        conn = sqlite3.connect(db_file)
        c = conn.cursor()

    
        c.execute('''
            CREATE TABLE IF NOT EXISTS Results (
                id INTEGER PRIMARY KEY,
                run_date TEXT,
                final_fitness REAL,
                selected_features_count INTEGER,
                optimal_features_indices TEXT,
                chromosome TEXT
            )
        ''')

        features_indices_str = str(optimal_features_indices)
        chromosome_str = str(chromosome_genes)
        run_date = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


        c.execute('''
            INSERT INTO Results (run_date, final_fitness, selected_features_count, optimal_features_indices, chromosome)
            VALUES (?, ?, ?, ?, ?)
        ''', (run_date, fitness, len(optimal_features_indices), features_indices_str, chromosome_str))

        conn.commit()
        conn.close()
        print(f"\n[DB] Results successfully saved to {db_file}")

    except Exception as e:
        print(f"\n[DB ERROR] Could not save results: {e}")


def execute_feature_selection_ga(user_file_path, user_target_column_name):
    global GLOBAL_X, GLOBAL_Y
    

    X, y, feature_count = load_and_preprocess_data(user_file_path, user_target_column_name)
    
    if X is None:
        print("\n[FAILED] Could not process user data. Aborting GA.")
        return

    GLOBAL_X = X
    GLOBAL_Y = y
    DATASET_SIZE = X.shape[0]
    FEATURE_COUNT = feature_count
    
  
    feature_scores = np.random.rand(FEATURE_COUNT).tolist() 

    print("======================================================")
    print("=  Genetic Algorithm for Feature Selection Started   =")
    print("======================================================")
    print(f"\n[INFO] Dataset Parameters: {DATASET_SIZE} samples, {FEATURE_COUNT} features.")
    print("[INFO] Calculating initial feature relevance scores...")
    print(f"[SCORES] {' '.join([f'{s:.3f}' for s in feature_scores])}\n")


    POP_COUNT = 100
    MAX_GENERATIONS = 50
    CROSSOVER_RATE = 0.7 
    TOURNAMENT_PARTICIPANTS = 3
    MUTATION_PER_GENE_PROB = 1.0 / FEATURE_COUNT

    current_generation = generate_population(POP_COUNT, FEATURE_COUNT)
    overall_best_solution = None

   
    for solution in current_generation:
        solution.fitness = assess_fitness(solution, feature_scores)

    print("--- Starting Evolution Process ---")
    for gen in range(MAX_GENERATIONS):
        selected_pool = [select_via_tournament(current_generation, TOURNAMENT_PARTICIPANTS) for _ in range(POP_COUNT)]
        next_generation = [duplicate_candidate(sol) for sol in selected_pool]

        for i in range(0, POP_COUNT, 2):
            if i + 1 < POP_COUNT and random.random() < CROSSOVER_RATE:
                child1, child2 = recombine_parents(next_generation[i], next_generation[i + 1])
                next_generation[i], next_generation[i+1] = child1, child2

        for mutant in next_generation:
            apply_random_mutation(mutant, MUTATION_PER_GENE_PROB)

        for solution in next_generation:
            solution.fitness = assess_fitness(solution, feature_scores)

        current_generation = next_generation
        gen_best = max(current_generation, key=lambda sol: sol.fitness)
        
        if overall_best_solution is None or gen_best.fitness > overall_best_solution.fitness:
            overall_best_solution = duplicate_candidate(gen_best)

        avg_fit = sum(sol.fitness for sol in current_generation) / POP_COUNT
        print(f"Generation {gen + 1:02d}/{MAX_GENERATIONS} | Best Fitness: {gen_best.fitness:.4f} | Avg Fitness: {avg_fit:.4f}")

    optimal_features = [i for i, gene in enumerate(overall_best_solution.genes) if gene == 1]


    print("\n\n-----------------------------------------")
    print("      Final Results of the GA Run      ")
    print("-----------------------------------------")
    print(f"-> Optimal Solution Fitness: {overall_best_solution.fitness:.4f}")
    print(f"-> Number of Features Selected: {len(optimal_features)}")
    print(f"-> Indices of Optimal Features: {optimal_features}")
    print(f"-> Best Gene Combination (Chromosome): {overall_best_solution.genes}")
    print("\nExecution complete.")

  
    save_results_to_db(
        fitness=overall_best_solution.fitness,
        optimal_features_indices=optimal_features,
        chromosome_genes=overall_best_solution.genes
    )


if __name__ == "__main__":
    

    dummy_data = {
        'Numerical_Feature_1': np.random.rand(100),
        'Numerical_Feature_2': np.random.randint(0, 5, 100),
        'Text_Feature_3': ['Red'] * 50 + ['Blue'] * 50, 
        'Text_Feature_4': ['High', 'Low'] * 50, 
        'Target': np.random.randint(0, 2, 100) 
    }
    df = pd.DataFrame(dummy_data)
    dummy_file_path = 'user_uploaded_data.csv'
    df.to_csv(dummy_file_path, index=False)
    

    user_file = dummy_file_path
    target_name = 'Target' 

 
    execute_feature_selection_ga(user_file, target_name)