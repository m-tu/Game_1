(ns app.core
  (:use org.httpkit.server
        [clojure.tools.logging :only [info]]
        org.nfrac.cljbox2d.core)
  (:require [ring.middleware.reload :as reload]
            [clojure.data.json :as json]
            [compojure.handler :refer [site]]
            [compojure.route :as route]
            [compojure.core :refer [defroutes GET]]))

(defn set-interval [ms callback]
  (future (while (do (Thread/sleep ms)
                     (try (do (callback) (-> true))
                          (catch Exception e (info (str (.toString e) ": " (.getMessage e)))
                                             (-> false)))))))

(def poopertron (atom nil))

(defn dynamic-entities [state]
  (let [bodies (bodyseq (:world state))]
    (filter #(= (body-type %) :dynamic) bodies)))

(defn add-job [state job]
  (let [new-jobs (conj (:jobs state) job)]
    (assoc state :jobs new-jobs)))

(defn stop-jobs! [state]
  (let [jobs (:jobs state)]
    (doseq [j jobs] (future-cancel j))))

(defn remove-jobs [state]
  (assoc state :jobs []))

(defn get-body [id state]
  (let [dyn-bodies (dynamic-entities state)]
    (first (filter #(= (:id (user-data %)) id) dyn-bodies))))

(defn remove-body! [net-id state]
  (let [dyn-bodies (dynamic-entities state)
        matching (filter #(= (:id (user-data %)) net-id) dyn-bodies)]
    (doseq [b matching] 
      (info (str "destroying body from net-id " net-id " " b))
      (destroy! b))))

(defn remote-clients [local state]
  (filter #(not= % local) (keys (:clients state))))

(defn serialize-entity [body]
  (let [position (position body)
        user-data (user-data body)]
  (-> {:position position
       :id (:id user-data)
       :type (:type user-data)})))

(defn make-msg [msg-type content]
  (json/write-str {:type msg-type :content content}))

(defn make-spawns [state]
  (map serialize-entity (dynamic-entities state)))

(defn handle-close! [channel state]
  (let [remote-chans (remote-clients channel state)
        clients (:clients state)
        channel-info (get clients channel)
        id (:net-id channel-info)]
    (remove-body! id state)
    (swap! poopertron assoc :clients (dissoc clients channel))
    (doseq [rc remote-chans]
      (send! rc (make-msg :player-quit {:id id})))))

(defn recv-client-update! [cl-state sv-state]
  (let [body (get-body (:id cl-state) sv-state)
        position (:position cl-state)
        rotation (:rotation cl-state)
        rot-vec [(Math/sin rotation) (Math/cos rotation)]
        v (linear-velocity body)
        m (mass body)
        speed 5.0
        velocity-vec (map #(* % speed) rot-vec)
        velocity-diff (mapv - velocity-vec v)
        impulse (map #(* % m) velocity-diff)
        center (center body)]
    (apply-impulse! body impulse center)))

(defn handle-join-req! [channel state]
  (let [world (:world state)
        player-id (count (bodyseq world))
        new-clients (update-in (:clients state) [channel] assoc
                               :conn-state :connected
                               :net-id player-id)
        remote-channels (remote-clients channel state)]
    (body! world 
           {:position [0 0]
            :user-data {:id player-id :type :player}}
           {:shape (circle 2)
            :restitution 0.1})
    (send! channel (make-msg :join-ack {:id player-id :position [0 0]}))
    (doseq [rc remote-channels]
      (send! rc (make-msg :player-join {:id player-id :position [0 0]})))
    (swap! poopertron assoc :clients new-clients)))
                                                    
(defn ws-handler [request]
  (with-channel request channel
    (info channel "connected")
    (send! channel (make-msg :spawns (make-spawns @poopertron)))
    (swap! poopertron assoc-in [:clients channel] {:conn-state :unresolved})
    (on-close channel (fn [status]
                        (handle-close! channel @poopertron)
                        (info "channel closed: " status)))
    (on-receive channel (fn [data]
                          (let [msg (json/read-str data :key-fn keyword)
                                msg-type (:type msg)
                                content (:content msg)]
                            (case msg-type
                              "join-req" (handle-join-req! channel @poopertron)
                              "cl-update" (recv-client-update! content @poopertron)
                              "default"))))))

(defroutes all-routes
  (GET "/" [] "gtfo")
  (GET "/feed" [] ws-handler)
  (route/not-found "not found"))

(defn in-dev? [args] true)

(defn connected-players [state]
  (filter (fn [[channel, info]] (= (:conn-state info) :connected))
          (seq (:clients state))))

(defn stop-server []
  (let [state @poopertron]
    (when-not (nil? state)
      (stop-jobs! state)
      (doseq [conn (keys (:clients state))]
        (close conn))
      ((:server state) :timeout 250)
      (reset! poopertron nil))))


(defn move-entities [state]
  (let [bodies (dynamic-entities state)
        n (count bodies)]
    (doseq [b (repeatedly (rand-int n) #(rand-nth bodies))]
      (apply-impulse! b [(+ -6 (rand-int 13)) (+ -6 (rand-int 13))] (center b)))))


(defn state-broadcast [state]
  (let [channels (connected-players state)
        dyn-bodies (dynamic-entities state)]
    (def entities (map serialize-entity dyn-bodies))
    (def msg (make-msg :update entities))
    (doseq [[channel, _] channels]
      (send! channel msg))))

(defn start-server [& args]
  (let [handler (if (in-dev? args)
                 (reload/wrap-reload (site #'all-routes))
                 (site all-routes))]
    (stop-server)
    (let [server (run-server handler {:port 9001})
          world (new-world [0 0])]
      (body! world {:type :static} {:shape (edge [-25 25] [-25 -25])})
      (body! world {:type :static} {:shape (edge [-25 -25] [25 -25])})
      (body! world {:type :static} {:shape (edge [25 -25] [25 25])})
      (body! world {:type :static} {:shape (edge [25 25] [-25 25])})
      (dotimes [n 40]
        (body! world {:position [(+ 5 (rand-int 10)) 10] :user-data {:id n :type :npc}}
               {:shape (circle (/ 3 2)) :restitution 0.4}))
      (reset! poopertron {:server server
                          :clients {}
                          :world world
                          :jobs [(set-interval 1000 #(move-entities @poopertron))
                                 (set-interval 100 #(state-broadcast @poopertron))
                                 (set-interval 20 #(step! (:world @poopertron) (/ 1 20)))]}))))
